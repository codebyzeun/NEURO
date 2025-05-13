const config = require('../config.json');
const Brain = require('./core/brain');
const TwitchBot = require('./interfaces/twitch');
const DiscordBot = require('./interfaces/discord');
const StreamControl = require('./actions/streamControl');
const STT = require('./speech/stt');
const TTS = require('./speech/tts');
const Logger = require('./utils/logger');
const Memory = require('./core/memory');

const logger = new Logger(config.loggerOptions || {});
const memory = new Memory(config.memoryOptions || {});
const tts = new TTS(config.ttsOptions || {});
const stt = new STT(config.sttOptions || {});

const twitchBot = new TwitchBot({
    ...config.twitchOptions,
    modelOptions: config.modelOptions
});
const discordBot = new DiscordBot({
    ...config.discordOptions,
    modelOptions: config.modelOptions
});
const streamControl = new StreamControl({
    obsOptions: config.obsOptions,
    twitchBot: twitchBot
});
const brain = new Brain({
    modelOptions: config.modelOptions,
    tokenizerOptions: config.tokenizerOptions,
    maxMemoryLength: config.maxMemoryLength,
    tts: tts,
    dispatchers: [
        {
            send: async (response, meta) => {
                if (meta.platform === 'twitch') {
                    await twitchBot.client.say(twitchBot.channel, response);
                } else if (meta.platform === 'discord') {
                    await meta.message.reply(response);
                }
            }
        }
    ]
});
(async () => {
    try {
        logger.info('Starting AI system...');

        if (config.useTwitch) {
            await twitchBot.start();
            logger.info('Twitch bot started.');
            twitchBot.client.on('message', async (channel, tags, message, self) => {
                if (self) return;
                const response = await brain.handleInput(message, { platform: 'twitch', user: tags.username });
                logger.info(`[Twitch] ${tags.username}: ${message} => ${response}`);
            });
        }

        if (config.useDiscord) {
            await discordBot.start();
            logger.info('Discord bot started.');
            discordBot.client.on('messageCreate', async (msg) => {
                if (msg.author.bot) return;
                const response = await brain.handleInput(msg.content, { platform: 'discord', user: msg.author.username, message: msg });
                logger.info(`[Discord] ${msg.author.username}: ${msg.content} => ${response}`);
            });
        }
        if (config.useOBS !== false) {
            await streamControl.connectOBS();
            logger.info('OBS connection established.');
        }

        logger.info('AI system is fully operational.');
    } catch (err) {
        logger.error('Fatal error during startup: ' + err.stack);
        process.exit(1);
    }
})();