const OBSWebSocket = require('obs-websocket-js').default;
const config = require('../../config.json');

class OBSController {
    constructor(options = {}) {
        this.obsUrl = options.obsUrl || config.obsWebSocketUrl || 'ws://127.0.0.1:4455';
        this.password = options.password || config.obsPassword || '';
        this.obs = new OBSWebSocket();
        this.connected = false;
    }
    async connect() {
        if (this.connected) return;
        try {
            await this.obs.connect(this.obsUrl, this.password);
            this.connected = true;
            console.log('Connected to OBS WebSocket.');
        } catch (err) {
            console.error('Failed to connect to OBS:', err);
            throw err;
        }
    }
    async disconnect() {
        if (!this.connected) return;
        await this.obs.disconnect();
        this.connected = false;
        console.log('Disconnected from OBS WebSocket.');
    }
    async switchScene(sceneName) {
        await this.connect();
        try {
            await this.obs.call('SetCurrentProgramScene', { sceneName });
            console.log(`Switched to scene: ${sceneName}`);
        } catch (err) {
            console.error('Error switching scene:', err);
        }
    }
    async triggerTransition(transitionName) {
        await this.connect();
        try {
            await this.obs.call('SetCurrentTransition', { transitionName });
            await this.obs.call('TriggerTransition');
            console.log(`Triggered transition: ${transitionName}`);
        } catch (err) {
            console.error('Error triggering transition:', err);
        }
    }
    async setSourceVisibility(sourceName, visible, sceneName = null) {
        await this.connect();
        try {
            await this.obs.call('SetSceneItemEnabled', {
                sceneName: sceneName || (await this.getCurrentScene()),
                sceneItemId: await this.getSceneItemId(sourceName, sceneName),
                sceneItemEnabled: visible
            });
            console.log(`${visible ? 'Enabled' : 'Disabled'} source: ${sourceName}`);
        } catch (err) {
            console.error('Error setting source visibility:', err);
        }
    }
    async getCurrentScene() {
        await this.connect();
        const { currentProgramSceneName } = await this.obs.call('GetCurrentProgramScene');
        return currentProgramSceneName;
    }
    async getSceneItemId(sourceName, sceneName = null) {
        await this.connect();
        const scene = sceneName || (await this.getCurrentScene());
        const { sceneItems } = await this.obs.call('GetSceneItemList', { sceneName: scene });
        const item = sceneItems.find(i => i.sourceName === sourceName);
        if (!item) throw new Error(`Source "${sourceName}" not found in scene "${scene}"`);
        return item.sceneItemId;
    }
}
module.exports = OBSController;