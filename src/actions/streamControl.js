const OBSController = require('../interfaces/obs');
const config = require('../../config.json');

class StreamControl {
    constructor(options = {}) {
        this.obs = new OBSController(options.obsOptions || {});
        this.twitchBot = options.twitchBot || null; //TwitchBot instance for chat messages
    }

    //Connect to OBS if not already connected
    async connectOBS() {
        await this.obs.connect();
    }

    //Change the current OBS scene
    async changeScene(sceneName) {
        await this.connectOBS();
        await this.obs.switchScene(sceneName);
    }

    //Display a message overlay in OBS (requires a configured source)
    async showMessageOverlay(message, sourceName, sceneName = null) {
        await this.connectOBS();
        //Set the text of a source
        try {
            await this.obs.obs.call('SetInputSettings', {
                inputName: sourceName,
                inputSettings: { text: message },
                overlay: true
            });
            //Making sure the source is visible
            await this.obs.setSourceVisibility(sourceName, true, sceneName);
        } catch (err) {
            console.error('Failed to show message overlay:', err);
        }
    }

    //Hiding a message overlay in OBS
    async hideMessageOverlay(sourceName, sceneName = null) {
        await this.connectOBS();
        try {
            await this.obs.setSourceVisibility(sourceName, false, sceneName);
        } catch (err) {
            console.error('Failed to hide message overlay:', err);
        }
    }

    //Mute or unmute audio source in OBS
    async setAudioMute(sourceName, mute = true) {
        await this.connectOBS();
        try {
            await this.obs.obs.call('SetInputMute', {
                inputName: sourceName,
                inputMuted: mute
            });
        } catch (err) {
            console.error('Failed to set audio mute:', err);
        }
    }

    //Trigger a visual effect or transition in OBS
    async triggerEffect(effectName) {
        await this.connectOBS();
        try {
            await this.obs.triggerTransition(effectName);
        } catch (err) {
            console.error('Failed to trigger effect:', err);
        }
    }

    //Broadcast a message in Twitch chat
    async sendTwitchMessage(message) {
        if (this.twitchBot && typeof this.twitchBot.client?.say === 'function') {
            try {
                await this.twitchBot.client.say(this.twitchBot.channel, message);
            } catch (err) {
                console.error('Failed to send Twitch message:', err);
            }
        }
    }

    //Trigger a stream alert
    async triggerAlert(alertType, data = {}) {
        //Implement integration with your alert system here
        //Show an overlay or play a sound in OBS
        console.log(`Triggering alert: ${alertType}`, data);
        //Show a message overlay for alerts
        if (alertType === 'customMessage' && data.message && data.sourceName) {
            await this.showMessageOverlay(data.message, data.sourceName, data.sceneName);
        }
    }
}

module.exports = StreamControl;
