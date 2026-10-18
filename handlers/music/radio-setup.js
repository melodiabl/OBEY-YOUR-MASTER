const { z } = require('zod');
const { PermissionFlagsBits: F } = require('discord.js');
const { createSetupSettings } = require('../setup-settings');
const { requireSetupAccess } = require('../setup-access');
const { runSetupOperation } = require('../setup-operations');
const { serialize } = require('../setup-publications');
const { isStationUrl } = require('../radio-stations');
const { snowflake } = require('../setup-fields');
const nullableId = z.union([snowflake, z.null()]);
const fields = {
    enabled: {
        path: 'enabled247', default: false, schema: z.boolean()
    }, channel: {
        path: 'channel247Id', default: null, schema: nullableId
    }, text: {
        path: 'text247Id', default: null, schema: nullableId
    }, source: {
        path: 'radioSource', default: '', schema: z.string().refine(v => !v || isStationUrl(v))
    }, volume: {
        path: 'radioVolume', default: 50, schema: z.number().int().min(1).max(150)
    }, track: {
        path: 'radioTrackId', default: '', schema: z.string().max(500)
    }
};
const modeService = client => createSetupSettings(client.musicGuildSettings, fields);
async function radioAccess(client, context, settings) {
    const access = await requireSetupAccess(client, context);
    const channel = await access.guild.channels.fetch(settings.channel);
    if (!channel || channel.type !== 2 || channel.guildId !== access.guild.id || !channel.permissionsFor(access.bot)?.has([F.ViewChannel, F.Connect, F.Speak]) || !channel.permissionsFor(access.member)?.has([F.ViewChannel, F.Connect]) || access.member.voice?.channelId !== channel.id)
        throw Error('setup_resource');
    return access;
}
function activateRadio(client, context, settingsService) {
    return runSetupOperation(client, () => serialize(client, `${context.guildId}:radio`, async () => {
        const value = await settingsService.read(context.guildId), v = value.values;
        if (!isStationUrl(v.song) || !Number.isInteger(v.volume) || v.volume < 1 || v.volume > 150)
            throw Error('invalid_radio');
        let access = await radioAccess(client, context, v);
        const result = await client.music.search(v.song, access.member.user, {
            guildId: context.guildId
        });
        if (!result?.tracks?.length)
            throw Error('radio_unavailable');
        access = await radioAccess(client, context, v);
        if (client._shuttingDown || context.isActive && !context.isActive())
            throw Error('setup_unavailable');
        if ((await settingsService.read(context.guildId)).revision !== value.revision)
            throw Error('setup_conflict');
        await client.music.stop(context.guildId);
        await radioAccess(client, context, v);
        if (client._shuttingDown || context.isActive && !context.isActive())
            throw Error('setup_unavailable');
        await client.music.joinChannel(context.guildId, v.channel, context.channelId);
        const state = client.music.getState(context.guildId), same = () => client.music.getState(context.guildId) === state && state.voiceChannelId === v.channel && !client._shuttingDown;
        await client.music.setVolume(context.guildId, v.volume);
        if (!same() || state.currentTrack || state.queue.length)
            throw Error('setup_conflict');
        await client.music.playCollection(context.guildId, v.channel, context.channelId, [result.tracks[0]], access.member.user);
        if (!same() || !state.currentTrack)
            throw Error('setup_conflict');
        const mode = modeService(client), old = await mode.read(context.guildId);
        await mode.save(context.guildId, {
            enabled: true, channel: v.channel, text: context.channelId, source: v.song, volume: v.volume, track: state.currentTrack.info?.identifier || ''
        }, old.revision);
    }));
}
function stopRadio(client, context) {
    return runSetupOperation(client, () => serialize(client, `${context.guildId}:radio`, async () => {
        await requireSetupAccess(client, context);
        const service = modeService(client), v = await service.read(context.guildId);
        if (!v.values.source)
            return;
        if (client._shuttingDown || context.isActive && !context.isActive())
            throw Error('setup_unavailable');
        const state = client.music.getState(context.guildId);
        if (state.voiceChannelId === v.values.channel && v.values.track && state.currentTrack?.info?.identifier === v.values.track)
            await client.music.stop(context.guildId);
        const latest = await service.read(context.guildId);
        if (latest.revision !== v.revision)
            throw Error('setup_conflict');
        await service.save(context.guildId, {
            enabled: false, source: '', track: '', channel: null, text: null
        }, latest.revision);
    }));
}
function restoreRadio(client, row) {
    return runSetupOperation(client, () => serialize(client, `${row.id}:radio`, async () => {
        if (!row.radioSource || !isStationUrl(row.radioSource) || client._shuttingDown)
            return false;
        const service = modeService(client), saved = await service.read(row.id);
        if (!saved.values.enabled || saved.values.source !== row.radioSource || saved.values.channel !== row.channel247Id)
            return false;
        const guild = client.guilds.cache.get(row.id);
        const channel = guild && await guild.channels.fetch(row.channel247Id), bot = guild && await guild.members.fetchMe();
        if (!channel || channel.type !== 2 || !channel.permissionsFor(bot)?.has([F.ViewChannel, F.Connect, F.Speak]))
            return false;
        await client.music.joinChannel(row.id, row.channel247Id, row.text247Id);
        const state = client.music.getState(row.id);
        await client.music.setVolume(row.id, Math.max(1, Math.min(150, Number(row.radioVolume) || 50)));
        if (client._shuttingDown || client.music.getState(row.id) !== state || state.voiceChannelId !== row.channel247Id)
            return false;
        if (state.currentTrack || state.queue.length)
            return true;
        const result = await client.music.play(row.id, row.channel247Id, row.text247Id, row.radioSource, client.user);
        if (!result?.result?.tracks?.length)
            throw Error('radio_restore_unavailable');
        const current = await service.read(row.id);
        if (current.values.source === row.radioSource && current.values.channel === row.channel247Id && client.music.getState(row.id) === state)
            await service.save(row.id, {
                track: state.currentTrack?.info?.identifier || ''
            }, current.revision);
        return true;
    }));
}
module.exports = {
    activateRadio, stopRadio, restoreRadio, modeService
};
