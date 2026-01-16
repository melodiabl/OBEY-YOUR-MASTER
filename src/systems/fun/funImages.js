const { AttachmentBuilder } = require('discord.js')
const canvacord = require('canvacord')
const { fetchBuffer } = require('../../utils/httpClient')

async function avatarToBuffer (user) {
  const url = user.displayAvatarURL({ extension: 'png', size: 512 })
  return fetchBuffer(url, { headers: { 'User-Agent': 'DiscordBot' } })
}

async function renderTemplateOne ({ user, template }) {
  const avatar = await avatarToBuffer(user)
  const fn = canvacord?.canvacord?.[template]
  if (typeof fn !== 'function') throw new Error(`Template no disponible: ${template}`)
  const buf = await fn(avatar)
  return new AttachmentBuilder(buf, { name: `${template}.png` })
}

async function renderTemplateTwo ({ user1, user2, template }) {
  const a1 = await avatarToBuffer(user1)
  const a2 = await avatarToBuffer(user2)
  const fn = canvacord?.canvacord?.[template]
  if (typeof fn !== 'function') throw new Error(`Template no disponible: ${template}`)
  const buf = await fn(a1, a2)
  return new AttachmentBuilder(buf, { name: `${template}.png` })
}

module.exports = {
  avatarToBuffer,
  renderTemplateOne,
  renderTemplateTwo
}

