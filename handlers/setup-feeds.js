const { z } = require('zod')
const { label, snowflake, field, channel, template } = require('./setup-fields')
const { openFormSetup, checkResources } = require('./setup-form')
const { openRecordsSetup } = require('./setup-records')
const { openSetupChoices } = require('./setup-choices')
function creator(platform, input) {
  const value = input.trim()
  if (platform === 'youtube') {
    const id = /^UC[\w-]{22}$/.test(value) ? value : (() => { try { const url = new URL(value); return !url.username && !url.password && ['https:', 'http:'].includes(url.protocol) && ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname) ? /^\/channel\/(UC[\w-]{22})\/?$/.exec(url.pathname)?.[1] : null } catch { return null } })()
    return id ? 'https://www.youtube.com/channel/' + id : null
  }
  const account = value.replace(/^https?:\/\/(?:www\.)?(?:tiktok\.com\/@|twitch\.tv\/)/i, '').replace(/^@/, '').replace(/\/$/, '')
  return (platform === 'tiktok' ? /^[\w.]{1,100}$/ : /^\w{1,100}$/).test(account) ? account.toLowerCase() : null
}
const creatorSchema = platform => z.string().max(500).transform((value, context) => { const result = creator(platform, value); if (!result) { context.addIssue({ code: 'custom', message: 'invalid_creator' }); return z.NEVER } return result })
function feedDefinition(platform) {
  const description = platform === 'tiktok' ? label('El publicador de TikTok está desactivado en esta versión. Puedes conservar y editar sus preferencias.', 'The TikTok publisher is disabled in this version. You can keep and edit its preferences.') : undefined
  return { title: label(`Publicaciones de ${platform}`, `${platform} posts`), description, store: 'social_log', fields: {
    channel: channel(`${platform}.dc_channel`, '', 'Canal de Discord', 'Discord channel'),
    creators: field(`${platform}.channels`, 'list', [], z.array(z.string().max(500).refine(value => Boolean(creator(platform, value)))).max(1000), platform === 'youtube' ? 'Canales: URL /channel/UC… o ID UC…' : 'Usuarios de TikTok', platform === 'youtube' ? 'Channels: /channel/UC… URL or UC… ID' : 'TikTok users', { clear: [], parse(input, previous, removing) {
        const raw = input.split(/\r?\n/).map(value => value.trim()).filter(Boolean), normalized = raw.map(value => creator(platform, value))
        if (normalized.some(value => !value)) return undefined
        const old = Array.isArray(previous) ? previous : []
        if (removing) return old.filter(value => !raw.includes(value) && !normalized.includes(creator(platform, value)))
        return [...old, ...[...new Set(normalized)].filter(value => !old.some(existing => creator(platform, existing) === value))]
      } }),
  } }
}
function templateDefinition(platform) {
  return { title: label(`Mensajes de ${platform}`, `${platform} messages`), description: platform === 'tiktok' ? feedDefinition(platform).description : undefined, store: 'social_log', path: `${platform}.templates`, defaults: { [`${platform}.channels`]: [], [`${platform}.dc_channel`]: '' },
    schema: z.array(z.object({ creator: creatorSchema(platform), message: z.string().min(1).max(2000) }).passthrough()).max(1000),
    inputs: [{ id: 'creator', label: label('Canal o usuario', 'Channel or user'), max: 500 }, { id: 'message', label: label('Mensaje: {url} {author} {title}', 'Message: {url} {author} {title}'), multiline: true, max: 2000 }],
    key: entry => entry.creator, describe: entry => `${entry.creator}\n${entry.message}`,
    parse: (data, previous) => ({ ...previous, creator: creator(platform, data.creator), message: data.message }),
  }
}
function twitchDefinition(guildId) {
  return { title: label('Twitch: canal y roles', 'Twitch: channel and roles'), store: 'social_log', defaults: { 'twitch.DiscordServerId': guildId, 'twitch.channels': [] }, fields: {
    channel: channel('twitch.channelId', '', 'Canal de anuncios', 'Announcement channel'),
    give: field('twitch.roleID_GIVE', 'role', '', z.union([snowflake, z.literal('')]), 'Rol para el streamer en directo', 'Role for the live streamer', { clear: '', noAdmin: true }),
    ping: field('twitch.roleID_PING', 'role', '', z.union([snowflake, z.literal('')]), 'Rol para avisar', 'Role to notify', { clear: '', permissionOnly: true }),
  } }
}
const twitchRecords = { title: label('Streamers de Twitch', 'Twitch streamers'), store: 'social_log', path: 'twitch.channels',
  schema: z.array(z.object({ ChannelName: creatorSchema('twitch'), DISCORD_USER_ID: snowflake, twitch_stream_id: z.string(), message: z.string().min(1).max(2000) }).passthrough()).max(1000),
  inputs: [{ id: 'ChannelName', label: label('Usuario de Twitch', 'Twitch username'), max: 100 }, { id: 'DISCORD_USER_ID', label: label('ID del usuario de Discord', 'Discord user ID'), max: 20 }, { id: 'message', label: label('Mensaje de anuncio', 'Announcement message'), multiline: true, max: 2000 }],
  key: entry => entry.ChannelName, describe: entry => `${entry.ChannelName}: ${entry.DISCORD_USER_ID}\n${entry.message}`,
  parse: (data, previous) => ({ ...previous, ChannelName: creator('twitch', data.ChannelName), DISCORD_USER_ID: data.DISCORD_USER_ID.trim(), twitch_stream_id: previous?.twitch_stream_id || '', message: data.message }),
  async validate(entry, access) { const member = await access.guild.members.fetch({ user: entry.DISCORD_USER_ID, force: true }); if (member?.id !== entry.DISCORD_USER_ID || member.guild?.id !== access.guild.id) throw new Error('setup_resource') },
}
async function lookupTwitter(username, create) {
  if (!create) create = () => {
    const Twit = require('twit'), config = require('../social_log/twitter.json')
    return new Twit({ consumer_key: process.env.consumer_key || config.consumer_key, consumer_secret: process.env.consumer_secret || config.consumer_secret,
      access_token: process.env.access_token || config.access_token, access_token_secret: process.env.access_token_secret || config.access_token_secret, timeout_ms: 8000, strictSSL: true })
  }
  const api = create(), result = await api.get('users/search', { q: username, count: 10 })
  const exact = result.data?.find(user => user.screen_name?.toLowerCase() === username.toLowerCase())
  if (!exact || !/^\d{1,30}$/.test(exact.id_str)) throw new Error('setup_account_unavailable')
  return exact.id_str
}
function twitterDefinition() {
  return { title: label('Publicaciones de X / Twitter', 'X / Twitter posts'), store: 'social_log', defaults: { 'twitter.latesttweet': '' },
    invalid: label('No se pudo validar la cuenta o el canal. Si la búsqueda del proveedor falla, completa el ID numérico manualmente junto al usuario.', 'The account or channel could not be validated. If provider lookup fails, enter the numeric ID manually together with the username.'),
    fields: { username: field('twitter.TWITTER_USER_NAME_ONLY_THOSE', 'text', '', z.string().trim().regex(/^@?\w{0,100}$/).transform(value => value.replace(/^@/, '').toLowerCase()), 'Usuario (sin @)', 'Username (without @)', { allowEmpty: true, maxInput: 100, clear: '' }),
      userid: field('twitter.TWITTER_USER_ID', 'text', '', z.string().trim().regex(/^\d{0,30}$/), 'ID numérico (vacío: buscar al guardar)', 'Numeric ID (empty: lookup on save)', { allowEmpty: true, maxInput: 30, clear: '' }),
      channel: channel('twitter.DISCORD_CHANNEL_ID', '', 'Canal de Discord', 'Discord channel'),
      message: template('twitter.infomsg', '**{Twittername}** posted a new Tweet:\n\n{url}', 'Mensaje: {Twittername} {url}', 'Message: {Twittername} {url}'),
      retweets: field('twitter.REETWET', 'boolean', false, z.boolean(), 'Incluir retweets', 'Include retweets'),
    }, async prepare(values, draft) {
      if (Object.hasOwn(draft, 'username') && !values.username) return { ...draft, userid: '' }
      if (values.username && (!values.userid || Object.hasOwn(draft, 'username') && !Object.hasOwn(draft, 'userid'))) return { ...draft, userid: await lookupTwitter(values.username) }
      return draft
    },
  }
}
function openFeedsSetup(client, message, id) {
  if (id === 'twitter') return openFormSetup(client, message, twitterDefinition())
  if (id === 'twitch') return openSetupChoices(client, message, label('Twitch', 'Twitch'), [
    { id: 'settings', title: label('Canal y roles', 'Channel and roles'), open: (client, message) => openFormSetup(client, message, twitchDefinition(message.guild.id)) },
    { id: 'streamers', title: label('Streamers', 'Streamers'), open: (client, message) => openRecordsSetup(client, message, { ...twitchRecords, defaults: { 'twitch.DiscordServerId': message.guild.id, 'twitch.channelId': '', 'twitch.roleID_GIVE': '', 'twitch.roleID_PING': '' } }) },
  ])
  if (!['youtube', 'tiktok'].includes(id)) throw new Error('invalid_setup_definition')
  return openSetupChoices(client, message, label(`Publicaciones de ${id}`, `${id} posts`), [
    { id: 'settings', title: label('Canal y suscripciones', 'Channel and subscriptions'), open: (client, message) => openFormSetup(client, message, feedDefinition(id)) },
    { id: 'templates', title: label('Mensajes por creador', 'Messages by creator'), open: (client, message) => openRecordsSetup(client, message, templateDefinition(id)) },
  ])
}
module.exports = { openFeedsSetup, feedDefinition, templateDefinition, twitchDefinition, twitchRecords, twitterDefinition, creator, lookupTwitter }
