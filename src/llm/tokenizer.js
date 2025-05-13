const fs = require('fs');
const path = require('path');

class Tokenizer {
    constructor(options = {}) {
        // Path to the GGML model's vocabulary file
        this.vocabPath = options.vocabPath || path.resolve(__dirname, '../../models/tokenizer.json');
        this.modelType = options.modelType || 'mistral'; // Default to mistral
        
        // Special tokens from your model logs
        this.specialTokens = {
            bos: '<s>',
            eos: '</s>',
            unk: '<unk>',
            pad: '<unk>', // In your logs, PAD token is mapped to UNK
            lf: '<0x0A>'  // Line feed special token
        };
        
        // Map special token names to IDs (these should match what's in your model)
        this.specialTokensIds = {
            bos: 1,
            eos: 2,
            unk: 0,
            pad: 0,
            lf: 13
        };
        
        // Vocabulary lookup dictionaries
        this.vocab = {};       // token -> id
        this.invVocab = {};    // id -> token
        
        this.loadVocabulary();
    }
    
    loadVocabulary() {
        // Check if vocab file exists
        if (fs.existsSync(this.vocabPath)) {
            try {
                const vocabData = JSON.parse(fs.readFileSync(this.vocabPath, 'utf8'));
                this.vocab = vocabData;
                
                // Create inverse mapping
                for (const [token, id] of Object.entries(this.vocab)) {
                    this.invVocab[id] = token;
                }
                
                // Ensure special tokens are in the vocabulary
                this.ensureSpecialTokens();
                
                console.log(`Loaded vocabulary with ${Object.keys(this.vocab).length} tokens`);
            } catch (error) {
                throw new Error(`Failed to load vocabulary: ${error.message}`);
            }
        } else {
            // If no vocabulary file exists, you might want to create one from the model
            console.warn('Vocabulary file not found. Attempting to extract from model...');
            this.extractVocabFromModel();
        }
    }
    
    // This method would extract vocabulary information directly from the GGUF model
    extractVocabFromModel() {
        // Implementation depends on how you can access model metadata
        throw new Error('Vocabulary extraction not implemented. Please provide a vocab.json file.');
    }
    
    ensureSpecialTokens() {
        // Make sure all required special tokens are in the vocabulary
        for (const [name, token] of Object.entries(this.specialTokens)) {
            if (!this.vocab[token]) {
                const id = this.specialTokensIds[name];
                console.warn(`Adding missing special token to vocabulary: ${token} (${id})`);
                this.vocab[token] = id;
                this.invVocab[id] = token;
            }
        }
    }
    
    // SentencePiece-like tokenization (simplified)
    encode(text) {
        if (!this.vocab || Object.keys(this.vocab).length === 0) {
            throw new Error('Vocabulary not loaded. Cannot encode text.');
        }
        
        // Add BOS token if configured to do so
        const tokens = [];
        if (this.modelType === 'mistral') {
            // Your logs indicate add_bos_token = true for Mistral
            tokens.push(this.specialTokensIds.bos);
        }
        
        // Simple subword tokenization approach
        // For a real implementation, you'd want to use the actual algorithm from SentencePiece
        // This is a simplified version that tries to tokenize by character if word not found
        const words = text.split(/\s+/);
        for (const word of words) {
            if (this.vocab.hasOwnProperty(word)) {
                tokens.push(this.vocab[word]);
            } else {
                // If word not found, try character by character
                let charsEncoded = false;
                for (const char of word) {
                    if (this.vocab.hasOwnProperty(char)) {
                        tokens.push(this.vocab[char]);
                        charsEncoded = true;
                    } else {
                        tokens.push(this.specialTokensIds.unk);
                        charsEncoded = true;
                    }
                }
                
                // If we couldn't encode by characters either, use UNK token
                if (!charsEncoded) {
                    tokens.push(this.specialTokensIds.unk);
                }
            }
        }
        
        return tokens;
    }
    
    decode(tokenIds) {
        if (!this.invVocab || Object.keys(this.invVocab).length === 0) {
            throw new Error('Inverse vocabulary not loaded. Cannot decode tokens.');
        }
        
        // Handle special tokens properly during decoding
        return tokenIds.map(id => {
            // Skip BOS token
            if (id === this.specialTokensIds.bos) {
                return '';
            }
            // Replace EOS token with nothing or a special marker
            else if (id === this.specialTokensIds.eos) {
                return '';
            }
            // Handle newline token properly
            else if (id === this.specialTokensIds.lf) {
                return '\n';
            }
            // Look up normal tokens
            else if (this.invVocab.hasOwnProperty(id)) {
                return this.invVocab[id];
            } 
            // Return empty string for unknown IDs
            else {
                return '';
            }
        }).join('').trim();
    }
    
    // Add BOS token to a sequence
    addBos(tokens) {
        return [this.specialTokensIds.bos, ...tokens];
    }
    
    // Add EOS token to a sequence
    addEos(tokens) {
        return [...tokens, this.specialTokensIds.eos];
    }
}

module.exports = Tokenizer;