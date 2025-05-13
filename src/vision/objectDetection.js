const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ObjectDetection {
    constructor(options = {}) {
        this.engine = options.engine || 'yolo';
        this.modelPath = options.modelPath || path.resolve(__dirname, '../../models/object_detection');
        this.yoloPath = options.yoloPath || 'yolo';
        this.clipPath = options.clipPath || 'clip';
    }
    async detectFromFile(imagePath) {
        if (this.engine === 'yolo') {
            return await this.detectWithYolo(imagePath);
        } else if (this.engine === 'clip') {
            return await this.detectWithClip(imagePath);
        } else {
            throw new Error('Unsupported object detection engine: ' + this.engine);
        }
    }
    async detectWithYolo(imagePath) {
        return new Promise((resolve, reject) => {
            const args = [
                '--model', this.modelPath,
                '--image', imagePath,
                '--output', 'json'
            ];
            const proc = spawn(this.yoloPath, args);

            let output = '';
            let error = '';

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.stderr.on('data', (data) => {
                error += data.toString();
            });
            proc.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output);
                        resolve(result);
                    } catch (err) {
                        reject(new Error('Failed to parse YOLO output: ' + err));
                    }
                } else {
                    reject(new Error('YOLO detection failed: ' + error));
                }
            });
        });
    }
    async detectWithClip(imagePath) {
        return new Promise((resolve, reject) => {
            const args = [
                '--model', this.modelPath,
                '--image', imagePath,
                '--output', 'json'
            ];
            const proc = spawn(this.clipPath, args);

            let output = '';
            let error = '';

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.stderr.on('data', (data) => {
                error += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output);
                        resolve(result);
                    } catch (err) {
                        reject(new Error('Failed to parse CLIP output: ' + err));
                    }
                } else {
                    reject(new Error('CLIP detection failed: ' + error));
                }
            });
        });
    }
    async detectFromVideo(videoPath) {
        throw new Error('Video object detection not implemented. Integrate with a video processing pipeline if needed.');
    }
}
module.exports = ObjectDetection;