const ModelRunner = require('../llm/modelRunner');
const Tokenizer = require('../llm/tokenizer');
const config = require('../../config.json');

class Brain {
    constructor(options = {}) {
        this.modelRunner = new ModelRunner(options.modelOptions || {});
        this.tokenizer = new Tokenizer(options.tokenizerOptions || {});
        this.memory = [];
        this.maxMemoryLength = options.maxMemoryLength || 20;
        this.tts = options.tts || null; 
        this.dispatchers = options.dispatchers || []; 
    }
    async handleInput(input, meta = {}) {
    this.addToMemory({ role: meta.role || 'user', content: input });

    const prompt = this.buildPrompt();

    let response;
    try {
        response = await this.modelRunner.generate(prompt);
    } catch (err) {
        console.error('Model generation error:', err);
        response = "Sorry, I couldn't generate a response.";
    }

    this.addToMemory({ role: 'ai', content: response });
    
    if (this.tts?.enabled === true && this.tts?.engine !== 'none') {
        try {
            await this.tts.speak(response, meta);
        } catch (err) {
            console.error('TTS error:', err);
        }
    }
    await this.dispatchResponse(response, meta);
    return response;
}
    addToMemory(entry) {
        this.memory.push(entry);
        if (this.memory.length > this.maxMemoryLength) {
            this.memory.shift();
        }
    }
    buildPrompt() {
        const history = this.memory
            .map(entry => {
                if (entry.role === 'user') return `User: ${entry.content}`;
                if (entry.role === 'ai') return `Assistant: ${entry.content}`;
                return `${entry.role}: ${entry.content}`;
            })
            .join('\n');

        return `[INST] You are Reka, a friendly AI assistant. Always respond in complete sentences.
Previous conversation:
${history}
Current response should be natural and complete.
[/INST]`;
    }
    async dispatchResponse(response, meta) {
        for (const dispatcher of this.dispatchers) {
            try {
                await dispatcher.send(response, meta);
            } catch (err) {
                console.error('Dispatcher error:', err);
            }
        }
    }
    registerDispatcher(dispatcher) {
        this.dispatchers.push(dispatcher);
    }
    clearMemory() {
        this.memory = [];
    }
}
module.exports = Brain;
