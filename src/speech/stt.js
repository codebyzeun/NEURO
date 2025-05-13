const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class STT {
    constructor(options = {}) {
        this.engine = options.engine || 'whisper';
        this.modelPath = options.modelPath || path.resolve(__dirname, '../../models/stt');
        this.language = options.language || 'en';
        this.whisperPath = options.whisperPath || 'whisper.cpp';
        this.voskPath = options.voskPath || 'vosk';
    }

    async transcribeFile(audioFilePath) {
        if (this.engine === 'whisper') {
            return await this.transcribeWithWhisper(audioFilePath);
        } else if (this.engine === 'vosk') {
            return await this.transcribeWithVosk(audioFilePath);
        } else {
            throw new Error('Unsupported STT engine: ' + this.engine);
        }
    }
    async transcribeWithWhisper(audioFilePath) {
        return new Promise((resolve, reject) => {
            const args = [
                '--model', this.modelPath,
                '--language', this.language,
                '--file', audioFilePath,
                '--output-txt'
            ];
            const proc = spawn(this.whisperPath, args);

            let transcript = '';
            let error = '';

            proc.stdout.on('data', (data) => {
                transcript += data.toString();
            });
            proc.stderr.on('data', (data) => {
                error += data.toString();
            });
            proc.on('close', (code) => {
                if (code === 0) {
                    const txtPath = audioFilePath.replace(/\.[^/.]+$/, '') + '.txt';
                    if (fs.existsSync(txtPath)) {
                        const result = fs.readFileSync(txtPath, 'utf8');
                        fs.unlinkSync(txtPath);
                        resolve(result.trim());
                    } else {
                        resolve(transcript.trim());
                    }
                } else {
                    reject(new Error('Whisper STT failed: ' + error));
                }
            });
        });
    }
    async transcribeWithVosk(audioFilePath) {
        return new Promise((resolve, reject) => {
            const args = [
                '--model', this.modelPath,
                '--file', audioFilePath,
                '--language', this.language
            ];
            const proc = spawn(this.voskPath, args);

            let transcript = '';
            let error = '';

            proc.stdout.on('data', (data) => {
                transcript += data.toString();
            });

            proc.stderr.on('data', (data) => {
                error += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve(transcript.trim());
                } else {
                    reject(new Error('Vosk STT failed: ' + error));
                }
            });
        });
    }
    async transcribeMicrophone(durationSeconds = 5, tempAudioPath = 'temp_mic.wav') {
        throw new Error('Microphone capture not implemented. Please integrate with a recording library.');
    }
}
module.exports = STT;