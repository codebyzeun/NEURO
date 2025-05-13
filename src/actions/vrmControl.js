const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

class VRMControl {
    constructor(options = {}) {
        this.port = options.port || 8000;
        this.host = options.host || 'localhost';
        this.websocket = null;
        this.connected = false;
        this.expressionStates = new Map();
        this.blendShapePresets = {
            neutral: { happy: 0, angry: 0, sad: 0, surprised: 0 },
            happy: { happy: 1, angry: 0, sad: 0, surprised: 0 },
            angry: { happy: 0, angry: 1, sad: 0, surprised: 0 },
            sad: { happy: 0, angry: 0, sad: 1, surprised: 0 },
            surprised: { happy: 0, angry: 0, sad: 0, surprised: 1 }
        };
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.websocket = new WebSocket(`ws://${this.host}:${this.port}`);

            this.websocket.on('open', () => {
                this.connected = true;
                console.log('Connected to VRM application');
                resolve();
            });

            this.websocket.on('error', (error) => {
                console.error('VRM WebSocket error:', error);
                reject(error);
            });

            this.websocket.on('close', () => {
                this.connected = false;
                console.log('Disconnected from VRM application');
            });
        });
    }

    async setExpression(expression, value = 1.0) {
        if (!this.connected) {
            throw new Error('Not connected to VRM application');
        }

        const preset = this.blendShapePresets[expression.toLowerCase()];
        if (!preset) {
            throw new Error(`Unknown expression: ${expression}`);
        }

        try {
            await this._sendMessage({
                type: 'SetBlendShape',
                data: {
                    ...preset,
                    weight: Math.max(0, Math.min(1, value))
                }
            });
            this.expressionStates.set(expression, value);
        } catch (err) {
            console.error('Failed to set expression:', err);
            throw err;
        }
    }

    async setHeadRotation(x = 0, y = 0, z = 0) {
        if (!this.connected) {
            throw new Error('Not connected to VRM application');
        }

        try {
            await this._sendMessage({
                type: 'SetHeadRotation',
                data: { x, y, z }
            });
        } catch (err) {
            console.error('Failed to set head rotation:', err);
            throw err;
        }
    }

    async trackFace(enabled = true) {
        if (!this.connected) {
            throw new Error('Not connected to VRM application');
        }

        try {
            await this._sendMessage({
                type: 'SetFaceTracking',
                data: { enabled }
            });
        } catch (err) {
            console.error('Failed to set face tracking:', err);
            throw err;
        }
    }

    async resetModel() {
        if (!this.connected) {
            throw new Error('Not connected to VRM application');
        }

        try {
            await this._sendMessage({
                type: 'ResetModel',
                data: {}
            });
            this.expressionStates.clear();
        } catch (err) {
            console.error('Failed to reset model:', err);
            throw err;
        }
    }

    _sendMessage(message) {
        return new Promise((resolve, reject) => {
            if (!this.websocket || !this.connected) {
                reject(new Error('Not connected'));
                return;
            }

            try {
                this.websocket.send(JSON.stringify(message), (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
            this.connected = false;
        }
    }
}

module.exports = VRMControl;