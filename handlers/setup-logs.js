const { PermissionFlagsBits: F } = require('discord.js')
const { z } = require('zod')
const { openFormSetup } = require('./setup-form')
const { label, channel, field, snowflake, ids } = require('./setup-fields')
const { CATEGORIES } = require('./logs/policy')
const { t } = require('./i18n')

function logSetupDefinition() {
  const names = { server: ['Servidor', 'Server'], members: ['Miembros', 'Members'], moderation: ['Moderación', 'Moderation'], messages: ['Mensajes', 'Messages'], voice: ['Voz', 'Voice'] }
  const fields = { defaultChannel: channel('logger.channel', 'no', 'Canal general de registros', 'Default log channel', {
    hint: label('Elige un canal para recibir todas las categorías que usan el canal general. Puedes guardar solo este ajuste.', 'Choose a channel for all categories using the default. You can save just this setting.'),
  }) }
  for (const category of CATEGORIES) fields[category] = field('logChannels.' + category, 'channel', null, z.union([snowflake, z.literal(null), z.literal('no')]), ...names[category], {
    inherit: null, clear: 'no', hint: category === 'moderation'
      ? label('Elige un canal restringido a personal con Ver registro de auditoría. En un canal abierto se omiten los detalles. También puedes desactivar la categoría.', 'Choose a channel restricted to staff with View Audit Log. Details are omitted in an open channel. You can also disable this category.')
      : label('Elige otro canal para esta categoría, usa el canal general o déjala desactivada.', 'Choose a different channel for this category, use the default, or disable it.'),
    format: (value, locale) => value == null || value === 'inherit' ? t(locale, 'setup.form.inherited') : value === 'no' ? t(locale, 'setup.form.disabled') : `<#${value}>`,
  })
  fields.excludedChannelIds = field('logger.excludedChannelIds', 'channels', [], ids.max(100), 'Canales excluidos', 'Excluded channels', { channelTypes: [0, 2, 4, 5, 13, 15, 16], hint: label('Se omiten los eventos originados en estos canales. No cambia los avisos privados al dueño.', 'Events originating in these channels are omitted. Bot owner notices are unaffected.') })
  fields.includeMessageContent = field('logger.includeMessageContent', 'boolean', false, z.boolean(), 'Incluir texto de mensajes', 'Include message text', {
    hint: label('Desactivado por defecto. El texto solo se reenvía si se confirma la visibilidad del origen; no se archiva en la base de datos.', 'Off by default. Text is forwarded only when source visibility is confirmed; it is not archived in the database.'),
  })
  return { title: label('Registros del servidor', 'Server logs'), actorPermission: F.ManageGuild, fields, basicFields: ['defaultChannel', 'messages', 'members', 'moderation', 'voice', 'server'],
    previewLabel: label('Ver diagnóstico', 'View diagnostics'),
    previewAction: (client, context, values) => require('./logs/diagnostics').diagnoseLogs(client, context, values),
    service: (client, context) => require('./logs/configuration').createLogConfiguration(client, context, fields),
    description: label('Empieza por el canal general y guarda. Las categorías pueden heredar ese canal, tener otro o estar desactivadas. En Más opciones están las exclusiones y el texto de mensajes.', 'Start with the default channel and save. Categories can inherit it, use another channel or be disabled. More options contains exclusions and message text.') }
}
const openLogSetup = (client, origin, initialDraft) => openFormSetup(client, origin, { ...logSetupDefinition(), ...(initialDraft ? { initialDraft } : {}) })
module.exports = { logSetupDefinition, openLogSetup }
