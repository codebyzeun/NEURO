const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const Brain = require('./core/brain');
const Logger = require('./utils/logger');

const logger = new Logger(config.loggerOptions || {});
const brain = new Brain(config.apiBrainOptions || {});

const app = express();
const port = config.apiPort || 3000;

app.use(bodyParser.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.post('/generate', async (req, res) => {
    const { input, meta } = req.body;
    if (!input) {
        return res.status(400).json({ error: 'Missing input' });
    }
    try {
        const response = await brain.handleInput(input, meta || {});
        res.json({ response });
    } catch (err) {
        logger.error('Error in /generate: ' + err.stack);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});
app.get('/logs', (req, res) => {
    const logFile = config.loggerOptions?.logFile || path.resolve(__dirname, '../logs/app.log');
    const lines = parseInt(req.query.lines, 10) || 100;
    if (!fs.existsSync(logFile)) {
        return res.status(404).json({ error: 'Log file not found' });
    }
    try {
        const data = fs.readFileSync(logFile, 'utf8').split('\n');
        res.type('text/plain').send(data.slice(-lines).join('\n'));
    } catch (err) {
        logger.error('Error in /logs: ' + err.stack);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});
app.post('/restart', (req, res) => {
    logger.info('Restart requested via API.');
    res.json({ status: 'restart triggered (not implemented)' });
});
app.listen(port, () => {
    logger.info(`API server listening on port ${port}`);
});
module.exports = app;