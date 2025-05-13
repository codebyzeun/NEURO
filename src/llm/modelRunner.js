const { spawn } = require('child_process');
const path = require('path');

class ModelRunner {
    constructor(options = {}) {
        this.modelPath = options.modelPath || path.resolve(__dirname, 'NEURO/models/mistral-7b-instruct-v0.2.Q4_K_M.gguf');
        this.temperature = options.temperature || 0.7;
        this.top_p = options.top_p || 0.9;
        this.repetition_penalty = options.repetition_penalty || 1.1;
        this.maxContextLength = options.maxContextLength || 2048;
        this.batchSize = options.batchSize || 1;
        this.sessionState = {};
        this.llamaProcess = null;
    }
    async loadModel() {
    if (this.llamaProcess) {
        this.llamaProcess.kill();
    }
    const llamaExe = `"${process.env.LLAMA_CPP_PATH || 'llama-cli.exe'}"`;
    const modelPath = `"${this.modelPath}"`;
    
    this.llamaProcess = spawn(llamaExe, [
        '-m', modelPath,
        '-c', '32768',
        '-t', '4',
        '-ngl', '1',
        '--temp', this.temperature.toString(),
        '--repeat-penalty', this.repetition_penalty.toString(),
        '-n', '128',
        '--top-p', this.top_p.toString(),
        '-i'
    ], {
        shell: true,
        cwd: process.cwd()
    });
    this.llamaProcess.stdout.setEncoding('utf8');
    this.llamaProcess.stderr.setEncoding('utf8');

    return new Promise((resolve, reject) => {
        let modelLoaded = false;
        let errorOutput = '';

        this.llamaProcess.stderr.on('data', (data) => {
            console.log('Model loading:', data);
            if (data.includes('llama_model_load: loading') || data.includes('build: 5353')) {
                modelLoaded = true;
            }
            errorOutput += data;
        });
        this.llamaProcess.stdout.on('data', (data) => {
            if (modelLoaded) {
                resolve();
            }
        });
        setTimeout(() => {
            if (!modelLoaded) {
                this.llamaProcess.kill();
                reject(new Error('Model loading timed out'));
            }
        }, 60000);
        this.llamaProcess.once('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Model process exited with code ${code}: ${errorOutput}`));
            }
        });
    });
}
    async generate(prompt) {
    if (!this.llamaProcess) {
        await this.loadModel();
    }
    return new Promise((resolve, reject) => {
        let response = '';
        let completed = false;
        const responseTimeout = setTimeout(() => {
            if (!completed) {
                completed = true;
                resolve("I apologize but I'm taking too long to respond. Please try again.");
            }
        }, 15000);
        const onData = (data) => {
            response += data;
            if (!data) return;
            
            if (response.includes('\nUser:') || 
                response.includes('Assistant:') || 
                response.length > 100) {
                clearTimeout(responseTimeout);
                if (!completed) {
                    completed = true;
                    let cleanResponse = response
                        .split('\nUser:')[0]
                        .split('Assistant:')
                        .pop()
                        .trim();
                    resolve(cleanResponse || "I apologize but I couldn't generate a proper response.");
                }
            }
        };
        this.llamaProcess.stdout.on('data', onData);
        this.llamaProcess.stderr.on('data', (data) => {
            console.error('Model error:', data);
        });
        try {
            const formattedPrompt = `User: ${prompt}\nAssistant:`;
            this.llamaProcess.stdin.write(formattedPrompt + '\n');
        } catch (err) {
            reject(err);
        }
    });
}
    async close() {
        if (this.llamaProcess) {
            this.llamaProcess.kill();
            this.llamaProcess = null;
        }
    }
}
module.exports = ModelRunner;
