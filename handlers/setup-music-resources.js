const { z } = require('zod');
const { PermissionFlagsBits: F, MessageFlags, ButtonStyle } = require('discord.js');
const { field, channel, label, snowflake } = require('./setup-fields');
const { openFormSetup } = require('./setup-form');
const { openSetupChoices } = require('./setup-choices');
const setup = require('./music/setup');
function musicDefinition(client, kind = 'panel', actorPermission = F.ManageChannels) {
    if (!['panel', 'create', 'delete', 'legacy'].includes(kind)) throw Error('invalid_setup_definition');
    const fields = kind === 'create' ? {
        name: field('setupChannelName', 'text', 'musica', z.string().min(1).max(100), 'Nombre del canal nuevo', 'New channel name', {
            maxInput: 100
        })
    } : kind === 'delete' ? {
        confirmation: field('setupDeleteConfirmation', 'text', '', z.string().max(20), 'Confirma con el ID del canal', 'Confirm with the channel ID', {
            maxInput: 20, allowEmpty: true
        })
    } : kind === 'legacy' ? {
        legacyConfirmation: field('setupLegacyConfirmation', 'text', '', z.string().max(20), 'ID del canal antiguo que adoptarás', 'Legacy channel ID to adopt', {
            maxInput: 20, allowEmpty: true
        })
    } : {
        target: channel('setupTargetId', '', 'Destino (vacío usa el actual)', 'Target (empty uses current)'), override: field('setupReceiptOverride', 'text', '', z.union([snowflake, z.literal('')]), 'ID del mensaje para recuperación', 'Recovery message ID', {
            clear: '', allowEmpty: true, maxInput: 20
        })
    };
    const description = kind === 'create' ? label('Guarda el nombre y usa Publicar. Solo crea un canal si todavía no hay destino; si existe, actualiza su panel. Una creación incierta se resuelve seleccionando manualmente el canal en Panel y destino.', 'Save the name, then Publish. Creates a channel only if no target exists; otherwise updates its panel. Resolve an uncertain creation by selecting its channel manually under Panel and target.') : kind === 'delete' ? label('Publicar elimina el canal configurado y todo su contenido. Copia su ID, guárdalo y revisa el destino mostrado antes de publicar. Para conservar el canal, usa Retirar en Panel y destino.', 'Publish deletes the configured channel and all its contents. Copy its ID, save it and review the displayed target before publishing. To keep the channel, Unpublish under Panel and target.') : kind === 'legacy' ? label('Adopta el mensaje antiguo existente y reemplaza sus botones por los del reproductor actual. Confirma el ID de su canal y guarda; Publicar lo convierte sin crear otro mensaje ni borrar los campos antiguos.', 'Adopts the existing legacy message and replaces its buttons with current player controls. Confirm its channel ID and Save; Publish converts it without creating another message or deleting legacy fields.') : label('Guarda el destino y publica para crear o actualizar el panel. Retira el panel actual antes de cambiar de canal. Retirar conserva el canal y la reproducción. El ID de recuperación es opcional y debe pertenecer a un mensaje del bot.', 'Save the target and Publish to create or update the panel. Unpublish the current panel before moving channels. Unpublish keeps the channel and playback. Recovery ID is optional and must identify a bot message.');
    return {
        title: label(kind === 'create' ? 'Crear canal de música' : kind === 'delete' ? 'Eliminar canal de música' : kind === 'legacy' ? 'Adoptar panel antiguo' : 'Panel de música', kind === 'create' ? 'Create music channel' : kind === 'delete' ? 'Delete music channel' : kind === 'legacy' ? 'Adopt legacy panel' : 'Music panel'), fields, actorPermission, description,
        ...(kind === 'panel' ? { basicFields: ['target'] } : {}),
        publishLabel: kind === 'create' ? label('Crear canal de música', 'Create music channel') : kind === 'delete' ? label('Eliminar canal y contenido', 'Delete channel and contents') : kind === 'legacy' ? label('Convertir panel antiguo', 'Convert legacy panel') : label('Publicar reproductor', 'Publish music player'),
        publishStyle: kind === 'delete' ? ButtonStyle.Danger : ButtonStyle.Primary,
        unpublishLabel: label('Quitar solo el panel', 'Remove only the panel'),
        service(c) {
            const service = setup.settings(c);
            return {
                ...service, save: (id, patch, rev) => service.save(id, {
                    ...patch, ...(patch.target ? {
                        creation: ''
                    } : {})
                }, rev)
            };
        },
        publish: async (c, context) => {
            if (kind === 'create')
                return setup.create(c, c.guilds.cache.get(context.guildId), context);
            if (kind === 'delete') {
                const v = await setup.settings(c).read(context.guildId);
                return setup.remove(c, c.guilds.cache.get(context.guildId), context, {
                    deleteChannel: true, confirmation: v.values.confirmation
                });
            }
            if (kind === 'legacy') {
                const v = await setup.settings(c).read(context.guildId);
                if (v.values.legacyConfirmation !== c.musicsettings.get(context.guildId, 'channel'))
                    throw Error('invalid_confirmation');
                return setup.adoptLegacy(c, context);
            }
            return setup.publish(c, context);
        },
        ...(kind === 'panel' ? {
            unpublish: (c, context) => setup.remove(c, c.guilds.cache.get(context.guildId), context)
        } : {}),
    };
}
function definitionFor(client, origin, kind, permission) {
    const def = musicDefinition(client, kind, permission);
    def.preview = values => {
        const active = values.binding, target = kind === 'delete' ? active || values.target : values.target || active;
        const legacy = client.musicsettings.get(origin.guild.id, 'channel');
        return `Activo / Active: ${active ? `<#${active}>` : '—'}\nDestino / Target: ${target ? `<#${target}>` : '—'}${kind === 'legacy' ? `\nAntiguo / Legacy: ${legacy ? `<#${legacy}>` : '—'}` : ''}`;
    };
    return def;
}
function openMusicSetup(client, origin, action = '', actorPermission = F.ManageChannels) {
    const kind = ['delete', 'remove', 'borrar', 'quitar'].includes(String(action).toLowerCase()) ? 'delete' : String(action).toLowerCase() === 'create' ? 'create' : null;
    if (kind)
        return openFormSetup(client, origin, definitionFor(client, origin, kind, actorPermission));
    return openSetupChoices(client, origin, label('Música · configuración', 'Music · setup'), [['panel', 'Panel y destino', 'Panel and target'], ['create', 'Crear canal si falta', 'Create channel if missing'], ['legacy', 'Adoptar panel antiguo', 'Adopt legacy panel'], ['delete', 'Eliminar canal y contenido', 'Delete channel and contents']].map(([id, es, en]) => ({
        id, title: label(es, en), open: (c, m) => openFormSetup(c, m, definitionFor(c, m, id, actorPermission))
    })), {
        actorPermission
    });
}
async function openMusicSlashSetup(client, interaction) {
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral
    });
    const origin = {
        guild: interaction.guild, author: interaction.user, channelId: interaction.channelId, channel: interaction.channel, async reply(payload) {
            const message = await interaction.editReply(payload);
            // Ephemeral screens must keep using the interaction webhook to edit.
            return Object.create(message, { edit: { value: next => interaction.editReply(next) } });
        }
    };
    return openMusicSetup(client, origin, interaction.options.getString('accion') || '');
}
module.exports = {
    openMusicSetup, openMusicSlashSetup, musicDefinition, definitionFor
};
