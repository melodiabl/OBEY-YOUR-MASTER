const { REST } = require('discord.js');
const writers = new WeakMap();
function createSlashPublicationTransport(token, makeRequest) {
    const rest = new REST({ version: '10', timeout: 10000, retries: 0, rejectOnRateLimit: () => true, ...(makeRequest ? { makeRequest } : {}) }).setToken(token);
    return (route, body) => rest.put(route, { body });
}
function writeSlashRegistry(client, route, body) {
    if (!writers.has(client))
        writers.set(client, createSlashPublicationTransport(client.token));
    return writers.get(client)(route, body);
}
module.exports = { createSlashPublicationTransport, writeSlashRegistry };
