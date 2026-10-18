const { z } = require('zod');
const { PermissionFlagsBits: F, ChannelType } = require('discord.js');
const { field, channel, label } = require('./setup-fields');
const { openSetupChoices } = require('./setup-choices');
const { openFormSetup, checkResources } = require('./setup-form');
const { createSetupSettings } = require('./setup-settings');
const { createSetupChannel } = require('./setup-channel-creation');
function jtcFields(n) {
    if (!Number.isInteger(n) || n < 1 || n > 100)
        throw Error('invalid_setup_definition');
    const p = `jtcsettings${n}`;
    return {
        channel: channel(`${p}.channel`, '', 'Canal de entrada (vacío: desactivado)', 'Entry channel (empty: disabled)', {
            channelTypes: [2], send: false
        }), name: field(`${p}.channelname`, 'text', "{user}' Lounge", z.string().min(1).max(100), 'Nombre de salas temporales', 'Temporary room name', {
            maxInput: 100, hint: label('Usa {user} para el nombre del miembro.', 'Use {user} for the member name.')
        }), parent: channel(`${p}.parent`, '', 'Categoría del nuevo canal de entrada', 'New entry channel category', {
            channelTypes: [4], send: false
        })
    };
}
function jtcDefinition(n) {
    const fields = jtcFields(n), p = `jtcsettings${n}`;
    const validate = async (values, access) => {
        if (!access.bot.permissions.has([F.ManageChannels, F.MoveMembers]))
            throw Error('setup_resource');
        if (values.channel) {
            const c = await access.guild.channels.fetch(values.channel);
            if (!c?.permissionsFor(access.bot)?.has([F.ViewChannel, F.Connect]))
                throw Error('setup_resource');
        }
    };
    return {
        title: label(`Crear salas · ${n}`, `Create rooms · ${n}`), store: 'jtcsettings', fields, description: label('Selecciona un canal de voz existente y guarda, o guarda sin canal y usa Publicar para crear uno. Vaciar el canal y guardar desactiva ese acceso sin borrar salas abiertas. Si una creación queda incierta, selecciona el canal creado manualmente para resolverla.', 'Select an existing voice channel and save, or save without a channel and Publish to create one. Clearing the channel and saving disables that entry without deleting open rooms. If creation is uncertain, select the created channel manually to resolve it.'), validate,
        service(client, context) {
            const service = createSetupSettings(client.jtcsettings, {
                ...fields, pending: {
                    path: `${p}.creationPending`, default: '', schema: z.string().max(24)
                }
            }, () => Boolean(client._shuttingDown), {
                [`${p}.guild`]: context.guildId
            });
            return {
                ...service, save: (id, patch, rev) => service.save(id, {
                    ...patch, ...(patch.channel ? {
                        pending: ''
                    } : {})
                }, rev)
            };
        },
        publish(client, context) {
            const defs = {
                ...fields, pending: {
                    path: `${p}.creationPending`, default: '', schema: z.string().max(24)
                }
            };
            const service = createSetupSettings(client.jtcsettings, defs, () => false, {
                [`${p}.guild`]: context.guildId
            });
            const snapshot = v => ({
                ...v, channelId: v.values.channel, pending: v.values.pending
            });
            return createSetupChannel(client, context, {
                key: p, read: async () => snapshot(await service.read(context.guildId)), save: async (v, patch) => snapshot(await service.save(context.guildId, {
                    ...(patch.channelId !== undefined ? {
                        channel: patch.channelId
                    } : {}), ...(patch.pending !== undefined ? {
                        pending: patch.pending
                    } : {})
                }, v.revision)), validate: async (access, v) => {
                    await validate(v.values, access);
                    if (!access.bot.permissions.has(F.ManageRoles))
                        throw Error('setup_resource');
                    await checkResources(access, fields.parent, v.values.parent);
                }, options: async (access, v) => ({
                    name: `Crear sala ${n}`, type: ChannelType.GuildVoice, bitrate: Math.min(access.guild.maximumBitrate || 96000, 384000), userLimit: 4, ...(v.values.parent ? {
                        parent: v.values.parent
                    } : {}), permissionOverwrites: [{
                            id: access.guild.id, allow: [F.ViewChannel, F.Connect], deny: [F.Speak]
                        }, {
                            id: client.user.id, allow: [F.ViewChannel, F.Connect, F.Speak, F.ManageChannels, F.MoveMembers]
                        }]
                })
            });
        },
    };
}
function openJtcSetup(client, origin) {
    return openSetupChoices(client, origin, label('Salas temporales', 'Temporary rooms'), Array.from({
        length: 100
    }, (_, i) => ({
        id: String(i + 1), title: label(`Sistema ${i + 1}`, `System ${i + 1}`), open: (c, m) => openFormSetup(c, m, jtcDefinition(i + 1))
    })));
}
module.exports = {
    jtcDefinition, jtcFields, openJtcSetup
};
