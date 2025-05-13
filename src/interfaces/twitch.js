const tmi = require('tmi.js');
const ModelRunner = require('../llm/modelRunner');
const config = require('../../config.json');

class TwitchBot {
    constructor(options = {}) {
        this.username = options.username || config.twitchUsername;
        this.token = options.token || config.twitchToken;
        this.channel = options.channel || config.twitchChannel;
        this.prefix = options.prefix || '!';
        this.modelRunner = new ModelRunner(options.modelOptions || {});

        this.client = new tmi.Client({
            options: { debug: true },
            identity: {
                username: this.username,
                password: this.token
            },
            channels: [this.channel]
        });

        this.setupListeners();
    }
    setupListeners() {
        this.client.on('connected', (address, port) => {
            console.log(`Connected to Twitch chat at ${address}:${port}`);
        });

        this.client.on('message', async (channel, tags, message, self) => {
            if (self) return; 
            const isMention = message.includes(`@${this.username}`);
            const isPrefix = message.startsWith(this.prefix);

            if (isMention || isPrefix) {
                let prompt = message;
                if (isPrefix) {
                    prompt = prompt.slice(this.prefix.length).trim();
                } else {
                    prompt = prompt.replace(`@${this.username}`, '').trim();
                }

                if (prompt.length === 0) return;

                try {
                    await this.client.say(channel, 'Thinking...');
                    const response = await this.modelRunner.generate(prompt);
                    await this.client.say(channel, response);
                } catch (err) {
                    await this.client.say(channel, 'Sorry, there was an error generating a response.');
                    console.error(err);
                }
            }
        });
        this.client.on('subscription', (channel, username, method, message, userstate) => {
            this.client.say(channel, `Thank you for subscribing, ${username}!`);
        });
        this.client.on('emoteonly', (channel, enabled) => {
            if (enabled) {
                this.client.say(channel, 'Emote-only mode enabled!');
            } else {
                this.client.say(channel, 'Emote-only mode disabled!');
            }
        });
    }

    async start() {
        await this.client.connect();
    }

    async stop() {
        await this.client.disconnect();
    }
}
module.exports = TwitchBot;