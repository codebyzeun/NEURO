const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class Trainer {
    constructor(options = {}) {
        this.datasetPath = options.datasetPath || path.resolve(__dirname, '../../data/dataset.json');
        this.modelPath = options.modelPath || path.resolve(__dirname, '../../models/llama.bin');
        this.outputDir = options.outputDir || path.resolve(__dirname, '../../models/fine-tuned');
        this.epochs = options.epochs || 3;
        this.batchSize = options.batchSize || 8;
        this.learningRate = options.learningRate || 5e-5;
        this.useLoRA = options.useLoRA || false;
    }
    loadDataset() {
        if (!fs.existsSync(this.datasetPath)) {
            throw new Error('Dataset file not found: ' + this.datasetPath);
        }
        const data = JSON.parse(fs.readFileSync(this.datasetPath, 'utf8'));
        if (!Array.isArray(data)) {
            throw new Error('Dataset must be an array of prompt-response pairs.');
        }
        return data;
    }
    formatDataset(dataset) {
        return dataset.map(pair => ({
            prompt: pair.prompt,
            response: pair.response
        }));
    }
    async train() {
        const dataset = this.loadDataset();
        const formatted = this.formatDataset(dataset);

        const tempDatasetPath = path.resolve(__dirname, '../../data/formatted_dataset.json');
        fs.writeFileSync(tempDatasetPath, JSON.stringify(formatted, null, 2), 'utf8');

        let command, args;
        if (this.useLoRA) {
            command = 'python';
            args = [
                'train_lora.py',
                '--model_path', this.modelPath,
                '--data_path', tempDatasetPath,
                '--output_dir', this.outputDir,
                '--epochs', this.epochs,
                '--batch_size', this.batchSize,
                '--learning_rate', this.learningRate
            ];
        } else {
            command = 'python';
            args = [
                '-m', 'transformers.trainer',
                '--model_name_or_path', this.modelPath,
                '--train_file', tempDatasetPath,
                '--output_dir', this.outputDir,
                '--num_train_epochs', this.epochs,
                '--per_device_train_batch_size', this.batchSize,
                '--learning_rate', this.learningRate
            ];
        }

        return new Promise((resolve, reject) => {
            const proc = spawn(command, args, { stdio: 'inherit' });
            proc.on('close', (code) => {
                if (code === 0) {
                    resolve('Training completed successfully.');
                } else {
                    reject(new Error('Training failed with exit code ' + code));
                }
            });
        });
    }
}

module.exports = Trainer;