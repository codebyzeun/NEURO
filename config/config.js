const path = require('path');

module.exports = {
    twitchUsername: process.env.TWITCH_USERNAME || '',
    twitchToken: process.env.TWITCH_TOKEN || '',
    twitchChannel: process.env.TWITCH_CHANNEL || '',
    discordToken: process.env.DISCORD_TOKEN || '',
    obsWebSocketUrl: process.env.OBS_WEBSOCKET_URL || 'ws://127.0.0.1:4455',
    obsPassword: process.env.OBS_PASSWORD || '',
    modelOptions: {
        modelPath: process.env.MODEL_PATH || path.resolve(__dirname, '../models/llama.bin')
    },
    loggerOptions: {
        logDir: process.env.LOG_DIR || path.resolve(__dirname, '../logs'),
        logFile: process.env.LOG_FILE || path.resolve(__dirname, '../logs/app.log')
    },
    ttsOptions: {
        engine: process.env.TTS_ENGINE || 'edge',
        voice: process.env.TTS_VOICE || 'en-US-AriaNeural'
    },
    sttOptions: {
        engine: process.env.STT_ENGINE || 'whisper',
        language: process.env.STT_LANGUAGE || 'en'
    },
    memoryOptions: {
        shortTermLimit: parseInt(process.env.SHORT_TERM_LIMIT, 10) || 20,
        longTermPath: process.env.LONG_TERM_PATH || path.resolve(__dirname, '../data/long_term_memory.json')
    },
    tokenizerOptions: {
        vocabPath: process.env.VOCAB_PATH || path.resolve(__dirname, '../models/vocab.json')
    },
    maxMemoryLength: parseInt(process.env.MAX_MEMORY_LENGTH, 10) || 20,
    apiPort: parseInt(process.env.API_PORT, 10) || 3000
};