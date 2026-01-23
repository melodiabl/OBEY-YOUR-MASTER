const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, embed, okEmbed, warnEmbed, errorEmbed, infoEmbed } = require('./uiKit')

function normalizeSystem (system) {
  const s = String(system || '').trim().toLowerCase()
  return s || 'utility'
}

function normalizeAllowedMentions (allowedMentions) {
  if (allowedMentions) return allowedMentions
  return { parse: ['users', 'roles'], repliedUser: false }
}

async function replySafe (message, payload) {
  try {
    return await message.reply({ ...payload, allowedMentions: normalizeAllowedMentions(payload.allowedMentions) })
  } catch (e) {}
}

async function sendSafe (channel, payload) {
  try {
    return await channel.send({ ...payload, allowedMentions: normalizeAllowedMentions(payload.allowedMentions) })
  } catch (e) {}
}

async function replyEmbed (client, message, options) {
  const ui = await getGuildUiConfig(client, message.guild.id)
  const e = embed({ ui, ...options, system: normalizeSystem(options?.system) })
  return replySafe(message, { embeds: [e] })
}

async function sendEmbed (client, channel, guildId, options) {
  const ui = await getGuildUiConfig(client, guildId)
  const e = embed({ ui, ...options, system: normalizeSystem(options?.system) })
  return sendSafe(channel, { embeds: [e] })
}

async function replyOk (client, message, { system, title, lines, fields, footer, signature } = {}) {
  const ui = await getGuildUiConfig(client, message.guild.id)
  const e = okEmbed({ ui, system: normalizeSystem(system), title, lines, fields, footer, signature })
  return replySafe(message, { embeds: [e] })
}

async function replyWarn (client, message, { system, title, lines, fields, footer } = {}) {
  const ui = await getGuildUiConfig(client, message.guild.id)
  const e = warnEmbed({ ui, system: normalizeSystem(system), title, lines, fields, footer })
  return replySafe(message, { embeds: [e] })
}

async function replyInfo (client, message, { system, title, lines, fields, footer } = {}) {
  const ui = await getGuildUiConfig(client, message.guild.id)
  const e = infoEmbed({ ui, system: normalizeSystem(system), title, lines, fields, footer })
  return replySafe(message, { embeds: [e] })
}

async function replyError (client, message, { system, title, reason, hint, fields, footer } = {}) {
  const ui = await getGuildUiConfig(client, message.guild.id)
  const e = errorEmbed({ ui, system: normalizeSystem(system), title, reason, hint, fields, footer })
  return replySafe(message, { embeds: [e] })
}

module.exports = {
  replySafe,
  sendSafe,
  replyEmbed,
  sendEmbed,
  replyOk,
  replyWarn,
  replyInfo,
  replyError
}
