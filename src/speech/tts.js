const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TTS {
    constructor(options = {}) {
        this.engine = options.engine || 'edge';
        this.voice = options.voice || 'en-US-AriaNeural';
        this.edgePath = options.edgePath || 'edge-tts';
        this.piperPath = options.piperPath || 'piper';
        this.coquiPath = options.coquiPath || 'coqui-tts';
        this.outputDir = options.outputDir || path.resolve(__dirname, '../../data/tts');
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }
    async speak(text, meta = {}) {
        if (this.engine === 'edge') {
            return await this.speakWithEdge(text, meta);
        } else if (this.engine === 'piper') {
            return await this.speakWithPiper(text, meta);
        } else if (this.engine === 'coqui') {
            return await this.speakWithCoqui(text, meta);
        } else {
            throw new Error('Unsupported TTS engine: ' + this.engine);
        }
    }
    async speakWithEdge(text, meta = {}) {
        const outputPath = path.join(this.outputDir, `tts_${Date.now()}.wav`);
        return new Promise((resolve, reject) => {
            const args = [
                'speak',
                '--text', text,
                '--voice', this.voice,
                '--output', outputPath
            ];
            const proc = spawn(this.edgePath, args);

            let error = '';
            proc.stderr.on('data', (data) => {
                error += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0 && fs.existsSync(outputPath)) {
                    resolve(outputPath);
                } else {
                    reject(new Error('Edge TTS failed: ' + error));
                }
            });
        });
    }
    async speakWithPiper(text, meta = {}) {
        const outputPath = path.join(this.outputDir, `tts_${Date.now()}.wav`);
        return new Promise((resolve, reject) => {
            const proc = spawn(this.piperPath, ['--model', this.voice, '--output_file', outputPath]);
            let error = '';

            proc.stdin.write(text);
            proc.stdin.end();

            proc.stderr.on('data', (data) => {
                error += data.toString();
            });
            proc.on('close', (code) => {
                if (code === 0 && fs.existsSync(outputPath)) {
                    resolve(outputPath);
                } else {
                    reject(new Error('Piper TTS failed: ' + error));
                }
            });
        });
    }
    async speakWithCoqui(text, meta = {}) {
        const outputPath = path.join(this.outputDir, `tts_${Date.now()}.wav`);
        return new Promise((resolve, reject) => {
            const args = [
                '--text', text,
                '--out_path', outputPath,
                '--model_name', this.voice
            ];
            const proc = spawn(this.coquiPath, args);

            let error = '';
            proc.stderr.on('data', (data) => {
                error += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0 && fs.existsSync(outputPath)) {
                    resolve(outputPath);
                } else {
                    reject(new Error('Coqui TTS failed: ' + error));
                }
            });
        });
    }
    async playAudio(filePath) {
        throw new Error('Audio playback not implemented. Integrate with your preferred audio player.');
    }
}
module.exports = TTS;