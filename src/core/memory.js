const fs = require('fs');
const path = require('path');

class Memory {
    constructor(options = {}) {
        this.shortTermLimit = options.shortTermLimit || 20;
        this.shortTerm = [];
        this.longTermPath = options.longTermPath || path.resolve(__dirname, '../../data/long_term_memory.json');
        this.longTerm = [];

        if (fs.existsSync(this.longTermPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.longTermPath, 'utf8'));
                if (Array.isArray(data)) {
                    this.longTerm = data;
                }
            } catch (err) {
                console.error('Failed to load long-term memory:', err);
            }
        }
    }
    add(entry, saveToLongTerm = false) {
        this.shortTerm.push(entry);
        if (this.shortTerm.length > this.shortTermLimit) {
            this.shortTerm.shift();
        }
        if (saveToLongTerm) {
            this.longTerm.push(entry);
            this.saveLongTerm();
        }
    }
    getShortTerm() {
        return [...this.shortTerm];
    }
    getLongTerm() {
        return [...this.longTerm];
    }
    saveLongTerm() {
        try {
            fs.writeFileSync(this.longTermPath, JSON.stringify(this.longTerm, null, 2), 'utf8');
        } catch (err) {
            console.error('Failed to save long-term memory:', err);
        }
    }
    clearShortTerm() {
        this.shortTerm = [];
    }
    clearLongTerm() {
        this.longTerm = [];
        this.saveLongTerm();
    }
    searchLongTerm(keyword) {
        return this.longTerm.filter(entry =>
            typeof entry.content === 'string' && entry.content.includes(keyword)
        );
    }
}
module.exports = Memory;