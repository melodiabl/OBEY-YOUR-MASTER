require('dotenv').config({ override: true })
require('colors')
const Bot = require('./structures/Client.js');
(async () => new Bot())()
