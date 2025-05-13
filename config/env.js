// This module loads environment variables from a .env file if present.
// It should be required at the very top of your main entry point before any config is loaded.

const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

module.exports = process.env;