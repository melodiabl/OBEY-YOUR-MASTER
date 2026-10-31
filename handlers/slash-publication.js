const { Routes } = require('discord.js');
const { writeSlashRegistry } = require('./slash-publication-transport');
const { requireBotOwnerAccess } = require('./bot-owner-access');
const { runSetupOperation } = require('./setup-operations');
const { snapshotCatalog, remoteCatalog, outgoing, equivalent, difference } = require('./slash-publication-catalog');
const preparations = new WeakMap(), active = new WeakSet();
const fail = code => { throw Object.assign(new Error(code), { code }); };
const idOK = value => typeof value === 'string' && /^\d{17,20}$/.test(value);
const route = (botId, target) => target ? Routes.applicationGuildCommands(botId, target) : Routes.applicationCommands(botId);
function bounded(client, execute, timeoutMs) { let timer, expired = false, admitted = false; const check = () => { if (client._shuttingDown || client._dbReady === false)
    fail('setup_unavailable'); if (expired)
    fail('slash_timeout'); }; const op = runSetupOperation(client, () => execute(check, () => { admitted = true; })); const deadline = new Promise((_, reject) => { timer = setTimeout(() => { expired = true; reject(Object.assign(new Error('slash_timeout'), { code: admitted ? 'slash_unconfirmed' : 'slash_timeout' })); }, timeoutMs); }); return Promise.race([op, deadline]).finally(() => clearTimeout(timer)); }
function identity(client) { const id = client.user?.id; if (!idOK(id) || client.application?.id && client.application.id !== id)
    fail('slash_unavailable'); return id; }
async function targetGuild(client, target) { if (!target)
    return null; if (!idOK(target) || !client.guilds.cache.has(target))
    fail('slash_target'); let guild, bot; try {
    guild = await client.guilds.fetch({ guild: target, force: true });
    if (guild?.id !== target || guild.available === false)
        fail('slash_target');
    bot = await guild.members.fetchMe({ force: true });
}
catch {
    fail('slash_target');
} if (bot?.id !== client.user.id || bot.guild?.id !== target || !client.guilds.cache.has(target))
    fail('slash_target'); return String(guild.name).slice(0, 100); }
async function readRemote(client, botId, target) { let body; try {
    body = await client.rest.get(route(botId, target), { query: new URLSearchParams({ with_localizations: 'true' }) });
}
catch {
    fail('slash_remote');
} return remoteCatalog(body, botId, target); }
function prepareSlashPublication(client, context, target, { ownerFile, timeoutMs = 10000 } = {}) {
    return bounded(client, async (check) => {
        if (target !== null && !idOK(target))
            fail('slash_target');
        await requireBotOwnerAccess(client, context, ownerFile);
        check();
        const botId = identity(client), name = await targetGuild(client, target);
        check();
        const local = snapshotCatalog(client), remote = await readRemote(client, botId, target);
        check();
        await requireBotOwnerAccess(client, context, ownerFile);
        check();
        if (snapshotCatalog(client).hash !== local.hash)
            fail('slash_conflict');
        const prepared = Object.freeze({ target, name, roots: local.roots, invocations: local.invocations, ...difference(local.body, remote.body), expiresAt: Date.now() + 30000 });
        preparations.set(prepared, { client, context: { ...context }, botId, localHash: local.hash, remoteHash: remote.hash });
        return prepared;
    }, timeoutMs);
}
async function publishLocked(client, botId, target, local, check, admit, { expectedRemote, authorize = async () => { }, beforeEffect = async () => { }, write = writeSlashRegistry } = {}) {
    const remote = await readRemote(client, botId, target);
    check();
    if (expectedRemote && remote.hash !== expectedRemote)
        fail('slash_conflict');
    if (snapshotCatalog(client).hash !== local.hash)
        fail('slash_conflict');
    if (equivalent(local.body, remote.body)) {
        await authorize();
        check();
        if (snapshotCatalog(client).hash !== local.hash || identity(client) !== botId)
            fail('slash_conflict');
        return { status: 'unchanged', roots: local.roots };
    }
    await beforeEffect();
    check();
    await authorize();
    check();
    const latest = await readRemote(client, botId, target);
    check();
    if (latest.hash !== remote.hash)
        fail('slash_conflict');
    await authorize();
    check();
    if (snapshotCatalog(client).hash !== local.hash || identity(client) !== botId)
        fail('slash_conflict');
    const body = outgoing(local.body, latest.body);
    let response;
    try {
        admit();
        response = await write(client, route(botId, target), body);
    }
    catch {
        fail('slash_unconfirmed');
    }
    try {
        remoteCatalog(response, botId, target);
        if (!equivalent(body, response))
            fail('slash_unconfirmed');
    }
    catch {
        fail('slash_unconfirmed');
    }
    return { status: 'confirmed', roots: local.roots };
}
function confirmSlashPublication(client, context, prepared, { ownerFile, timeoutMs = 20000, beforeEffect, write = writeSlashRegistry } = {}) {
    const entry = prepared && preparations.get(prepared);
    if (!entry || entry.client !== client || !['guildId', 'channelId', 'actorId'].every(k => entry.context[k] === context[k]))
        return Promise.reject(Object.assign(new Error('slash_invalid'), { code: 'slash_invalid' }));
    preparations.delete(prepared);
    return bounded(client, async (available, admit) => {
        const check = () => { available(); if (Date.now() >= prepared.expiresAt)
            fail('slash_expired'); if (identity(client) !== entry.botId)
            fail('slash_conflict'); if (prepared.target && (!client.guilds.cache.has(prepared.target) || client.guilds.cache.get(prepared.target).available === false))
            fail('slash_target'); };
        check();
        await requireBotOwnerAccess(client, context, ownerFile);
        check();
        if (active.has(client))
            fail('slash_busy');
        active.add(client);
        try {
            const name = await targetGuild(client, prepared.target);
            check();
            if (name !== prepared.name)
                fail('slash_conflict');
            const local = snapshotCatalog(client);
            if (local.hash !== entry.localHash)
                fail('slash_conflict');
            return await publishLocked(client, entry.botId, prepared.target, local, check, admit, { expectedRemote: entry.remoteHash, write, authorize: async () => { const current = await targetGuild(client, prepared.target); check(); if (current !== prepared.name)
                    fail('slash_conflict'); await requireBotOwnerAccess(client, context, ownerFile); }, beforeEffect: async () => { if (typeof beforeEffect !== 'function')
                    fail('slash_delivery'); try {
                    await beforeEffect();
                }
                catch {
                    fail('slash_delivery');
                } } });
        }
        finally {
            active.delete(client);
        }
    }, timeoutMs);
}
function syncGlobalCommands(client, { timeoutMs = 20000, write = writeSlashRegistry } = {}) { return bounded(client, async (check, admit) => { check(); if (active.has(client))
    fail('slash_busy'); active.add(client); try {
    const botId = identity(client), local = snapshotCatalog(client);
    return await publishLocked(client, botId, null, local, check, admit, { write });
}
finally {
    active.delete(client);
} }, timeoutMs); }
async function dryRunGlobalCommands(client) { const local = snapshotCatalog(client), remote = await readRemote(client, identity(client), null); return { equal: equivalent(local.body, remote.body), roots: local.roots, invocations: local.invocations, ...difference(local.body, remote.body) }; }
module.exports = { prepareSlashPublication, confirmSlashPublication, syncGlobalCommands, dryRunGlobalCommands };
