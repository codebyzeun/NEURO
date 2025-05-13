const fs = require('fs');
const path = require('path');

class Tokenizer {
    constructor(options = {}) {
        //Path to the GGML model vocabulary file
        this.vocabPath = options.vocabPath || path.resolve(__dirname, '../../models/tokenizer.json');
        this.modelType = options.modelType || 'mistral'; //Default mistral
        
        this.specialTokens = {
            bos: '<s>',
            eos: '</s>',
            unk: '<unk>',
            pad: '<unk>',
            lf: '<0x0A>'
        };
        
        //Map special token names to IDs
        this.specialTokensIds = {
            bos: 1,
            eos: 2,
            unk: 0,
            pad: 0,
            lf: 13
        };
        
        //Vocabulary lookup dictionaries
        this.vocab = {};       //token->id
        this.invVocab = {};    //id->token
        
        this.loadVocabulary();
    }
    
    loadVocabulary() {
        //Checking if vocab file exists
        if (fs.existsSync(this.vocabPath)) {
            try {
                const vocabData = JSON.parse(fs.readFileSync(this.vocabPath, 'utf8'));
                this.vocab = vocabData;
                
                //Creating inverse mapping
                for (const [token, id] of Object.entries(this.vocab)) {
                    this.invVocab[id] = token;
                }
                
                //Ensuring special tokens are in the vocabulary
                this.ensureSpecialTokens();
                
                console.log(`Loaded vocabulary with ${Object.keys(this.vocab).length} tokens`);
            } catch (error) {
                throw new Error(`Failed to load vocabulary: ${error.message}`);
            }
        } else {
            //If no vocabulary file exists might need to create one from the model
            console.warn('Vocabulary file not found. Attempting to extract from model...');
            this.extractVocabFromModel();
        }
    }
    //Extracting vocabulary information directly from the GGUF model
    extractVocabFromModel() {
        throw new Error('Vocabulary extraction not implemented. Please provide a vocab.json file.');
    }
    ensureSpecialTokens() {
        for (const [name, token] of Object.entries(this.specialTokens)) {
            if (!this.vocab[token]) {
                const id = this.specialTokensIds[name];
                console.warn(`Adding missing special token to vocabulary: ${token} (${id})`);
                this.vocab[token] = id;
                this.invVocab[id] = token;
            }
        }
    }
    //SentencePiece tokenization
    encode(text) {
        if (!this.vocab || Object.keys(this.vocab).length === 0) {
            throw new Error('Vocabulary not loaded. Cannot encode text.');
        }
        //BOS token if configured
        const tokens = [];
        if (this.modelType === 'mistral') {
            tokens.push(this.specialTokensIds.bos);
        }
        const words = text.split(/\s+/);
        for (const word of words) {
            if (this.vocab.hasOwnProperty(word)) {
                tokens.push(this.vocab[word]);
            } else {
                //try character by character
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
                
                //use UNK token
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
        //Handle special tokens properly during decoding
        return tokenIds.map(id => {
            if (id === this.specialTokensIds.bos) {
                return '';
            }
            else if (id === this.specialTokensIds.eos) {
                return '';
            }
            else if (id === this.specialTokensIds.lf) {
                return '\n';
            }
            else if (this.invVocab.hasOwnProperty(id)) {
                return this.invVocab[id];
            } 
            else {
                return '';
            }
        }).join('').trim();
    }
    //Adding BOS token to a sequence
    addBos(tokens) {
        return [this.specialTokensIds.bos, ...tokens];
    }
    //Adding EOS token to a sequence
    addEos(tokens) {
        return [...tokens, this.specialTokensIds.eos];
    }
}
module.exports = Tokenizer;
