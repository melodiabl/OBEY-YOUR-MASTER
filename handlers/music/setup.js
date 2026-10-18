const obeyMeta = require("../presentation/metadata");
const obeyUi = require("../assets/system");
// ─────────────────────────────────────────────────────────────────────────────
// OBEY — Motor de música v2: Canal de peticiones (port de Soundy setup/create.ts).
// Crea un canal dedicado con un PANEL ÚNICO que actúa de reproductor: escribir el
// nombre de una canción la reproduce y el panel se actualiza (idle ↔ now playing).
// ─────────────────────────────────────────────────────────────────────────────
const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { config } = require('./config');
const { z } = require('zod');
const { createSetupSettings } = require('../setup-settings');
const { publishSavedMessage, retireSavedMessage, serialize, publicationAccess } = require('../setup-publications');
const { runSetupOperation } = require('../setup-operations');
const { createSetupChannel } = require('../setup-channel-creation');
const { requireSetupAccess } = require('../setup-access');
const { snowflake } = require('../setup-fields');
const MusicGuild = require('../../database/schemas/MusicGuildSchema');
const { buildControls } = require('./controls');
const E = config.emoji;
const setupChannels = new Map(); // guildId -> channelId
const setupMessages = new Map(); // guildId -> messageId
async function load(client) {
    try {
        const rows = await MusicGuild.find({
            setupChannelId: {
                $ne: null
            }
        }).lean();
        for (const r of rows) {
            setupChannels.set(r.id, r.setupChannelId);
            if (r.setupTextId)
                setupMessages.set(r.id, r.setupTextId);
        }
        console.log(`[Music v2] ${rows.length} canal(es) de peticiones cargados`);
    }
    catch { /* db no lista aún */
    }
}
const isSetupChannel = (guildId, channelId) => setupChannels.get(guildId) === channelId;
const getChannelId = guildId => setupChannels.get(guildId);
const getMessageId = guildId => setupMessages.get(guildId);
function idlePanel(client) {
    const embed = new EmbedBuilder()
        .setColor(config.color.primary)
        .setTitle(`${E.music} Canal de Música`)
        .setDescription(`**Escribe el nombre o el enlace de una canción aquí para reproducirla.**\n\n${obeyUi.markup('brand.youtube')} YouTube · ${obeyUi.markup('brand.spotify')} Spotify · ${obeyUi.markup('brand.applemusic')} Apple Music`)
        .setImage(client.user.displayAvatarURL({
        size: 512
    }))
        .setFooter(obeyMeta.asFooter({
        text: 'Sin música reproduciéndose'
    }));
    return {
        embeds: [embed], components: buildControls({
            loop: 'none', paused: false
        }, {
            idle: true
        })
    };
}
// Vuelve el panel al estado "sin música"
async function resetToIdle(client, guildId) {
    if (!setupChannels.has(guildId))
        return;
    await updatePanel(client, guildId, idlePanel(client));
}
// One declared writer owns the request-channel binding and creation/publication receipts.
const nullableId = z.union([snowflake, z.null()]);
const setupFields = {
    target: {
        path: 'setupTargetId', default: '', schema: z.union([snowflake, z.literal('')])
    },
    binding: {
        path: 'setupChannelId', default: null, schema: nullableId
    },
    message: {
        path: 'setupTextId', default: null, schema: nullableId
    },
    nonce: {
        path: 'setupPublicationNonce', default: '', schema: z.string().max(24)
    },
    creation: {
        path: 'setupCreationNonce', default: '', schema: z.string().max(24)
    },
    name: {
        path: 'setupChannelName', default: 'musica', schema: z.string().min(1).max(100)
    },
    override: {
        path: 'setupReceiptOverride', default: '', schema: z.union([snowflake, z.literal('')])
    },
    confirmation: {
        path: 'setupDeleteConfirmation', default: '', schema: z.string().max(20)
    }, legacyConfirmation: {
        path: 'setupLegacyConfirmation', default: '', schema: z.string().max(20)
    },
};
function settings(client) {
    if (!client.musicGuildSettings)
        throw new Error('setup_unavailable');
    return createSetupSettings(client.musicGuildSettings, setupFields);
}
async function cacheBinding(guildId, value) {
    if (value.binding)
        setupChannels.set(guildId, value.binding);
    else
        setupChannels.delete(guildId);
    if (value.message)
        setupMessages.set(guildId, value.message);
    else
        setupMessages.delete(guildId);
    if (!value.binding) {
        const { liveMessages } = require('./state');
        if (liveMessages.get(guildId)?.isSetup) {
            await require('./liveupdate').stopLiveUpdate(guildId);
            liveMessages.delete(guildId);
        }
    }
}
function currentPanel(client, guildId) {
    const state = client.music?.getState(guildId);
    if (state?.currentTrack) {
        const { buildNPEmbed, buildControls } = require('./embeds');
        return {
            embeds: [buildNPEmbed(client, guildId, state)], components: buildControls(state)
        };
    }
    return idlePanel(client);
}
function requestPort(client, context, { automatic = false, payload } = {}) {
    const service = settings(client);
    const snapshot = value => ({
        ...value, channelId: value.values.binding || (!automatic && value.values.target), messageId: (!automatic && value.values.override) || value.values.message || '', nonce: value.values.nonce
    });
    return {
        key: 'music-request-panel', label: 'Música',
        async read() {
            return snapshot(await service.read(context.guildId));
        },
        async validate(_access, value) {
            if (!automatic && value.values.binding && value.values.target && value.values.target !== value.values.binding)
                throw new Error('setup_conflict');
            if (!automatic && value.values.message && value.values.override && value.values.message !== value.values.override)
                throw new Error('setup_conflict');
        },
        async save(value, patch) {
            const input = {
                ...(patch.nonce !== undefined ? {
                    nonce: patch.nonce
                } : {}), ...(patch.messageId !== undefined ? {
                    message: patch.messageId || null, binding: patch.messageId ? value.channelId : null, override: ''
                } : {})
            };
            const saved = await service.save(context.guildId, input, value.revision);
            if (patch.messageId !== undefined)
                await cacheBinding(context.guildId, saved.values);
            return snapshot(saved);
        },
        payload: async () => payload || currentPanel(client, context.guildId),
    };
}
async function updatePanel(client, guildId, payload) {
    if (!setupChannels.has(guildId) || client._shuttingDown)
        return null;
    return publishSavedMessage(client, {
        guildId
    }, requestPort(client, {
        guildId
    }, {
        automatic: true, payload
    }), {
        automatic: true, recreateMissing: true
    });
}
function publish(client, context) {
    return runSetupOperation(client, async () => {
        const message = await publishSavedMessage(client, context, requestPort(client, context));
        // Pinning is optional; receipt/binding is already confirmed if Discord refuses it.
        if (!client._shuttingDown && !message.pinned && typeof message.pin === 'function')
            await message.pin().catch(() => {
            });
        if (!client._shuttingDown && client.music?.getState(context.guildId)?.currentTrack) {
            const { liveMessages } = require('./state'), live = require('./liveupdate');
            await live.stopLiveUpdate(context.guildId);
            liveMessages.set(context.guildId, {
                messageId: message.id, channelId: message.channelId, isSetup: true
            });
            live.startLiveUpdate(client, context.guildId);
        }
        return message;
    });
}
async function create(client, guild, context) {
    if (!context?.actorId || context.guildId !== guild.id)
        throw new Error('setup_denied');
    const service = settings(client), snapshot = value => ({
        ...value, channelId: value.values.binding || value.values.target, pending: value.values.creation
    });
    const channelId = await createSetupChannel(client, context, {
        key: 'music-request-create', read: async () => snapshot(await service.read(guild.id)),
        save: async (value, patch) => snapshot(await service.save(guild.id, {
            ...(patch.pending !== undefined ? {
                creation: patch.pending
            } : {}), ...(patch.channelId !== undefined ? {
                target: patch.channelId
            } : {})
        }, value.revision)),
        validate: async (access) => {
            if (!access.bot.permissions.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles]))
                throw new Error('setup_resource');
        },
        options: async (_access, value) => ({
            name: value.values.name, type: ChannelType.GuildText, topic: 'Escribe el nombre o enlace de una canción para reproducirla.', permissionOverwrites: [
                {
                    id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
                },
                {
                    id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                },
            ]
        }),
    });
    await publish(client, context);
    return {
        ok: true, channelId
    };
}
async function remove(client, guild, context, { deleteChannel = false, confirmation = '' } = {}) {
    if (!context?.actorId || context.guildId !== guild.id)
        throw new Error('setup_denied');
    if (!deleteChannel) {
        await retireSavedMessage(client, context, requestPort(client, context));
        return {
            ok: true
        };
    }
    return runSetupOperation(client, () => serialize(client, `${guild.id}:music-request-panel`, async () => {
        let access = await requireSetupAccess(client, context);
        const service = settings(client), value = await service.read(guild.id), id = value.values.binding || value.values.target;
        if (!id || confirmation !== id)
            throw new Error('invalid_confirmation');
        const channel = await guild.channels.fetch(id).catch(error => {
            if (error.code === 10003)
                return null;
            throw error;
        });
        if (channel && (channel.guildId !== guild.id || ![0, 5].includes(channel.type) || !channel.permissionsFor(access.member)?.has(PermissionFlagsBits.ViewChannel) || !channel.permissionsFor(access.bot)?.has(PermissionFlagsBits.ManageChannels)))
            throw new Error('setup_resource');
        access = await requireSetupAccess(client, context);
        if (client._shuttingDown || context.isActive && !context.isActive())
            throw new Error('setup_unavailable');
        if ((await service.read(guild.id)).revision !== value.revision)
            throw new Error('setup_conflict');
        if (channel)
            await channel.delete('Music setup: explicit channel ID confirmation');
        const saved = await service.save(guild.id, {
            target: '', binding: null, message: null, nonce: '', creation: '', override: '', confirmation: ''
        }, value.revision);
        await cacheBinding(guild.id, saved.values);
        return {
            ok: true
        };
    }));
}
async function adoptLegacy(client, context) {
    await requireSetupAccess(client, context);
    const channelId = client.musicsettings.get(context.guildId, 'channel'), messageId = client.musicsettings.get(context.guildId, 'message');
    if (!snowflake.safeParse(channelId).success || !snowflake.safeParse(messageId).success)
        throw new Error('setup_resource');
    const target = await publicationAccess(client, context, channelId), message = await target.channel.messages.fetch(messageId);
    if (message.author.id !== client.user.id)
        throw new Error('setup_resource');
    const service = settings(client), value = await service.read(context.guildId);
    if (value.values.binding || value.values.message || value.values.nonce || value.values.creation)
        throw new Error('setup_conflict');
    await requireSetupAccess(client, context);
    if (client._shuttingDown || context.isActive && !context.isActive())
        throw new Error('setup_unavailable');
    await publicationAccess(client, context, channelId);
    await service.save(context.guildId, {
        target: channelId, binding: channelId, message: messageId, legacyConfirmation: ''
    }, value.revision);
    // Preserve shared legacy fields; radio and older readers may still use them.
    await cacheBinding(context.guildId, {
        binding: channelId, message: messageId
    });
    return publish(client, context);
}
// Mensaje en el canal de peticiones → reproducir + borrar
async function handleSetupMessage(client, message) {
    const query = message.content?.trim();
    message.delete().catch(() => {
    });
    if (!query)
        return;
    const flash = async (color, desc, ms = 6000) => {
        const m = await message.channel.send({
            embeds: [new EmbedBuilder().setColor(color).setDescription(desc)]
        }).catch(() => null);
        if (m)
            setTimeout(() => m.delete().catch(() => {
            }), ms);
    };
    const vc = message.member?.voice?.channel;
    if (!vc)
        return flash(config.color.no, `${E.no} <@${message.author.id}>, entra a un canal de voz primero.`);
    try {
        const res = await client.music.play(message.guild.id, vc.id, message.channel.id, query, message.author);
        if (!res?.result?.tracks?.length)
            return flash(config.color.no, `${obeyUi.markup("icon.mute")} No encontré nada para **${query.slice(0, 80)}**`);
        const info = res.result.tracks[0].info || res.result.tracks[0];
        const added = res.result.loadType === 'playlist' ? `playlist (${res.result.tracks.length} pistas)` : `**${(info.title || query).slice(0, 80)}**`;
        return flash(config.color.primary, `${E.music} Añadido: ${added}`, 5000);
    }
    catch {
        return flash(config.color.no, obeyUi.owned('❌ Error al reproducir.'));
    }
}
module.exports = {
    load, isSetupChannel, getChannelId, getMessageId, create, remove, publish, adoptLegacy, settings, setupFields, handleSetupMessage, idlePanel, resetToIdle, updatePanel
};
