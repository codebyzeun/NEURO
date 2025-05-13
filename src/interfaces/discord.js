const { Client, GatewayIntentBits, Partials } = require('discord.js');
const ModelRunner = require('../llm/modelRunner');
const config = require('../../config.json');

class DiscordBot {
    constructor(options = {}) {
        this.token = options.token || config.discordToken;
        this.prefix = options.prefix || '!';
        this.modelRunner = new ModelRunner(options.modelOptions || {});
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates
            ],
            partials: [Partials.Channel]
        });
        this.setupListeners();
    }

    setupListeners() {
        this.client.on('ready', () => {
            console.log(`Discord bot logged in as ${this.client.user.tag}`);
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;

            const isMention = message.mentions.has(this.client.user);
            const isPrefix = message.content.startsWith(this.prefix);

            if (isMention || isPrefix) {
                let prompt = message.content;
                if (isPrefix) {
                    prompt = prompt.slice(this.prefix.length).trim();
                } else {
                    prompt = prompt.replace(`<@${this.client.user.id}>`, '').trim();
                }

                if (prompt.length === 0) return;

                try {
                    await message.channel.sendTyping();
                    const response = await this.modelRunner.generate(prompt);
                    await message.reply(response);
                } catch (err) {
                    await message.reply('Sorry, there was an error generating a response.');
                    console.error(err);
                }
            }
        });
    }

    async start() {
        await this.client.login(this.token);
    }
    async stop() {
        await this.client.destroy();
    }
}
module.exports = DiscordBot;