const { escapeMarkdown } = require('discord.js')
const { field, label } = require('./setup-fields')
const { openFormSetup } = require('./setup-form')
const { globalConfigurationFile } = require('./global-configuration')
const { ownerAuthorization } = require('./setup-owner-settings')
const { statusSchema, statusFields } = require('./bot-status-contract')
const { createBotStatusSettings } = require('./bot-status-settings')
const { renderStatusText } = require('./bot-status-runtime')
function botStatusDefinition(client, options = {}) {
  const defaults = statusSchema.parse((client.config || require('../botconfig/config.json')).status)
  const fields = {
    text: field('text', 'text', defaults.text, statusFields.text, 'Primer texto', 'First text', { maxInput: 128 }),
    text2: field('text2', 'text', defaults.text2, statusFields.text2, 'Segundo texto', 'Second text', { maxInput: 128 }),
    type: field('type', 'enum', defaults.type, statusFields.type, 'Actividad', 'Activity', { options: ['PLAYING', 'LISTENING', 'WATCHING', 'STREAMING', 'COMPETING'],
      labels: { PLAYING: label('Jugando', 'Playing'), LISTENING: label('Escuchando', 'Listening'), WATCHING: label('Viendo', 'Watching'), STREAMING: label('En directo', 'Streaming'), COMPETING: label('Compitiendo', 'Competing') } }),
    url: field('url', 'text', defaults.url, statusFields.url, 'Canal de Twitch para directos', 'Twitch channel for streams', { allowEmpty: true, maxInput: 200 }),
    presence: field('presence', 'enum', defaults.presence, statusFields.presence, 'Disponibilidad', 'Availability', { options: ['online', 'idle', 'dnd'],
      labels: { online: label('En línea', 'Online'), idle: label('Ausente', 'Idle'), dnd: label('No molestar', 'Do not disturb') } }),
  }
  return { title: label('Estado del bot', 'Bot status'), fields,
    authorizeActor: ownerAuthorization(options.ownerFile || globalConfigurationFile('config.json')),
    description: label('Solo propietarios del bot. Edita y pulsa Guardar. Los dos textos alternan cada 90 segundos. Marcadores: {prefix}, {guildcount}, {membercount}, {name}, {tag}, {commands}, {usedcommands}, {songsplayed}, {created}, {createdtime}. Discord no confirma la recepción de la presencia.',
      'Bot owners only. Edit, then Save. The two texts alternate every 90 seconds. Placeholders: {prefix}, {guildcount}, {membercount}, {name}, {tag}, {commands}, {usedcommands}, {songsplayed}, {created}, {createdtime}. Discord does not acknowledge presence delivery.'),
    invalid: label('Revisa los textos y el enlace HTTPS de un canal de Twitch. Para En directo el enlace es obligatorio.', 'Check the texts and the HTTPS Twitch channel link. Streaming requires a link.'),
    validate: values => statusSchema.parse(values),
    service: (_client, context) => createBotStatusSettings(client, context, options),
    preview(values, locale) {
      const failed = client.botStatusDelivery === 'failed'
      const notice = failed ? locale === 'en' ? 'Saved settings may differ from Discord: presence request failed.' : 'Los ajustes guardados pueden diferir de Discord: falló el envío de presencia.' : ''
      return [escapeMarkdown(renderStatusText(client, values.text)), escapeMarkdown(renderStatusText(client, values.text2)), notice].filter(Boolean).join('\n')
    },
  }
}
const openBotStatus = (client, message) => openFormSetup(client, message, botStatusDefinition(client))
module.exports = { botStatusDefinition, openBotStatus }
