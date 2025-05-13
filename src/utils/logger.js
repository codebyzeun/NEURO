const fs = require('fs');
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.logDir = options.logDir || path.resolve(__dirname, '../../logs');
        this.logFile = options.logFile || path.join(this.logDir, 'app.log');
        this.maxSize = options.maxSize || 5 * 1024 * 1024; // 5 MB
        this.levels = { info: 0, warn: 1, error: 2 };
        this.console = options.console !== false;

        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    _format(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }
    _rotateLog() {
        if (fs.existsSync(this.logFile)) {
            const stats = fs.statSync(this.logFile);
            if (stats.size >= this.maxSize) {
                const rotated = this.logFile.replace(/\.log$/, `_${Date.now()}.log`);
                fs.renameSync(this.logFile, rotated);
            }
        }
    }
    _write(level, message) {
        const formatted = this._format(level, message);
        this._rotateLog();
        fs.appendFileSync(this.logFile, formatted + '\n', 'utf8');
        if (this.console) {
            if (level === 'info') console.log(formatted);
            else if (level === 'warn') console.warn(formatted);
            else if (level === 'error') console.error(formatted);
        }
    }
    info(message) {
        this._write('info', message);
    }
    warn(message) {
        this._write('warn', message);
    }
    error(message) {
        this._write('error', message);
    }
}
module.exports = Logger;