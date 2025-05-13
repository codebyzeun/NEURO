const robot = require('robotjs');
const { spawn } = require('child_process');
const path = require('path');

class GameBot {
    constructor(options = {}) {
        this.mode = options.mode || 'robotjs'; // 'robotjs' or 'pyautogui'
        this.pyScript = options.pyScript || path.resolve(__dirname, '../../scripts/game_control.py');
    }

    // Simulate a key press
    pressKey(key, duration = 100) {
        if (this.mode === 'robotjs') {
            robot.keyToggle(key, 'down');
            setTimeout(() => robot.keyToggle(key, 'up'), duration);
        } else if (this.mode === 'pyautogui') {
            this._sendToPython({ action: 'pressKey', key, duration });
        } else {
            throw new Error('Unsupported mode: ' + this.mode);
        }
    }

    // Simulate mouse movement to (x, y)
    moveMouse(x, y) {
        if (this.mode === 'robotjs') {
            robot.moveMouse(x, y);
        } else if (this.mode === 'pyautogui') {
            this._sendToPython({ action: 'moveMouse', x, y });
        } else {
            throw new Error('Unsupported mode: ' + this.mode);
        }
    }

    // Simulate mouse click
    click(button = 'left') {
        if (this.mode === 'robotjs') {
            robot.mouseClick(button);
        } else if (this.mode === 'pyautogui') {
            this._sendToPython({ action: 'click', button });
        } else {
            throw new Error('Unsupported mode: ' + this.mode);
        }
    }

    // Type a string of text
    typeString(text) {
        if (this.mode === 'robotjs') {
            robot.typeString(text);
        } else if (this.mode === 'pyautogui') {
            this._sendToPython({ action: 'typeString', text });
        } else {
            throw new Error('Unsupported mode: ' + this.mode);
        }
    }

    // Send a custom action to the Python bridge
    _sendToPython(command) {
        const proc = spawn('python', [this.pyScript, JSON.stringify(command)]);
        proc.on('error', (err) => {
            console.error('Python subprocess error:', err);
        });
        proc.stderr.on('data', (data) => {
            console.error('Python subprocess stderr:', data.toString());
        });
    }
}

module.exports = GameBot;