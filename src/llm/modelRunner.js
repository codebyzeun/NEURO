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
        const llamaExe = process.env.LLAMA_CPP_PATH || 'llama-cli.exe';
        
        this.llamaProcess = spawn(llamaExe, [
            '-m', this.modelPath,
            '-c', '2048',
            '-t', '8',  
            '-ngl', '1', 
            '--temp', this.temperature.toString(),
            '--repeat-penalty', this.repetition_penalty.toString(),
            '-n', '512',
            '--top-p', this.top_p.toString(),
            '-i', 
            '--prompt', 'Hello\nAssistant: Hi! I am ready to help.\n'
        ], {
            shell: false,
            cwd: process.cwd()
        });

        this.llamaProcess.stdout.setEncoding('utf8');
        this.llamaProcess.stderr.setEncoding('utf8');

        // Add error handler
        this.llamaProcess.on('error', (err) => {
            console.error('Model process error:', err);
        });

        return new Promise((resolve, reject) => {
            let modelLoaded = false;
            let errorOutput = '';

            this.llamaProcess.stderr.on('data', (data) => {
                console.log('Model loading:', data);
                if (data.includes('llama_model_load: loading') || 
                    data.includes('build: ') || 
                    data.includes('prepared')) {
                    modelLoaded = true;
                }
                errorOutput += data;
            });
            this.llamaProcess.stderr.once('data', () => {
                if (modelLoaded) {
                    resolve();
                }
            });
            setTimeout(() => {
                if (!modelLoaded) {
                    this.llamaProcess.kill();
                    reject(new Error('Model loading timed out'));
                }
            }, 30000);
        });
    }

    async generate(prompt) {
        if (!this.llamaProcess) {
            await this.loadModel();
        }

        return new Promise((resolve, reject) => {
            let fullResponse = '';
            let completed = false;
            let buffer = '';

            const responseTimeout = setTimeout(() => {
                if (!completed) {
                    completed = true;
                    resolve("I apologize, but I'm taking too long to respond. Please try again.");
                }
            }, 30000);

            const onData = (data) => {
                if (!data) return;
                
                buffer += data;
                
                if (/[.!?]/.test(buffer)) {
                    fullResponse += buffer;
                    buffer = '';
                    
                    if (fullResponse.includes('[/INST]')) {
                        let cleanResponse = fullResponse
                            .split('[/INST]')[1]
                            .split('\n>')[0]
                            .split('User:')[0]
                            .trim();

                        if (!cleanResponse.match(/[.!?]$/)) {
                            cleanResponse += '.';
                        }

                        if (cleanResponse && !completed) {
                            clearTimeout(responseTimeout);
                            completed = true;
                            resolve(cleanResponse);
                        }
                    }
                }
            };

            this.llamaProcess.stdout.on('data', onData);
            
            try {
                const systemPrompt = `You are Reka, a friendly AI assistant. Respond naturally in complete sentences.\nContext: Previous responses should inform your current response.\nUser: ${prompt}\nAssistant:`;
                this.llamaProcess.stdin.write(systemPrompt + '\n');
            } catch (err) {
                console.error('Write error:', err);
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
