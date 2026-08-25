// ─────────────────────────────────────────────────────────────────────────────
// OBEY — Motor de música v2: Canal de peticiones (port de Soundy setup/create.ts).
// Crea un canal dedicado con un PANEL ÚNICO que actúa de reproductor: escribir el
// nombre de una canción la reproduce y el panel se actualiza (idle ↔ now playing).
// ─────────────────────────────────────────────────────────────────────────────
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js')
const { config } = require('./config')
const { database } = require('./database')
const MusicGuild = require('../../database/schemas/MusicGuildSchema')
const E = config.emoji

const setupChannels = new Map() // guildId -> channelId
const setupMessages = new Map() // guildId -> messageId

function pe(m) { const x = /^<(a?):(\w+):(\d+)>$/.exec(String(m)); return x ? { animated: !!x[1], name: x[2], id: x[3] } : m }

async function load(client) {
  try {
    const rows = await MusicGuild.find({ setupChannelId: { $ne: null } }).lean()
    for (const r of rows) {
      setupChannels.set(r.id, r.setupChannelId)
      if (r.setupTextId) setupMessages.set(r.id, r.setupTextId)
    }
    console.log(`[Music v2] ${rows.length} canal(es) de peticiones cargados`)
  } catch { /* db no lista aún */ }
}

const isSetupChannel = (guildId, channelId) => setupChannels.get(guildId) === channelId
const getChannelId   = guildId => setupChannels.get(guildId)
const getMessageId   = guildId => setupMessages.get(guildId)

function idlePanel(client) {
  const embed = new EmbedBuilder()
    .setColor(config.color.primary)
    .setTitle(`${E.music} Canal de Música`)
    .setDescription('**Escribe el nombre o el enlace de una canción aquí para reproducirla.**\n\n🟢 YouTube · 🟢 Spotify · 🟢 SoundCloud · 🟢 Apple Music')
    .setImage(client.user.displayAvatarURL({ size: 512 }))
    .setFooter({ text: 'Sin música reproduciéndose' })
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('mp_shuffle').setEmoji(pe(E.shuffle)).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('mp_prev').setEmoji(pe(E.previous)).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('mp_toggle').setEmoji(pe(E.pause)).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('mp_skip').setEmoji(pe(E.skip)).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('mp_loop').setEmoji(pe(E.loop)).setStyle(ButtonStyle.Secondary).setDisabled(true),
  )
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('mp_lyrics').setEmoji(pe(E.list)).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('mp_voldown').setEmoji(pe(E.volDown)).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('mp_stop').setEmoji(pe(E.stop)).setStyle(ButtonStyle.Danger).setDisabled(true),
    new ButtonBuilder().setCustomId('mp_volup').setEmoji(pe(E.volUp)).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('mp_queue').setEmoji(pe(E.folder)).setStyle(ButtonStyle.Secondary).setDisabled(true),
  )
  return { embeds: [embed], components: [row1, row2] }
}

// Vuelve el panel al estado "sin música"
async function resetToIdle(client, guildId) {
  const chId = setupChannels.get(guildId), msgId = setupMessages.get(guildId)
  if (!chId || !msgId) return
  const ch = client.channels.cache.get(chId)
  const m  = ch && await ch.messages.fetch(msgId).catch(() => null)
  if (m) m.edit(idlePanel(client)).catch(() => {})
}

async function create(client, guild) {
  const existing = await database.getSetup(guild.id)
  if (existing) { setupChannels.set(guild.id, existing.channelId); return { ok: false, reason: 'exists', channelId: existing.channelId } }
  const channel = await guild.channels.create({
    name: '🎧・música',
    type: ChannelType.GuildText,
    topic: 'Escribe el nombre de una canción para reproducirla 🎶',
    permissionOverwrites: [
      { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] },
      { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ],
  }).catch(() => null)
  if (!channel) return { ok: false, reason: 'no_perms' }
  const msg = await channel.send(idlePanel(client)).catch(() => null)
  if (!msg) return { ok: false, reason: 'send_fail' }
  await database.createSetup(guild.id, channel.id, msg.id)
  setupChannels.set(guild.id, channel.id)
  setupMessages.set(guild.id, msg.id)
  return { ok: true, channelId: channel.id }
}

async function remove(client, guild) {
  const existing = await database.getSetup(guild.id)
  if (!existing) return { ok: false, reason: 'none' }
  const ch = guild.channels.cache.get(existing.channelId)
  if (ch) await ch.delete().catch(() => {})
  await database.deleteSetup(guild.id)
  setupChannels.delete(guild.id)
  setupMessages.delete(guild.id)
  return { ok: true }
}

// Mensaje en el canal de peticiones → reproducir + borrar
async function handleSetupMessage(client, message) {
  const query = message.content?.trim()
  message.delete().catch(() => {})
  if (!query) return
  const flash = async (color, desc, ms = 6000) => {
    const m = await message.channel.send({ embeds: [new EmbedBuilder().setColor(color).setDescription(desc)] }).catch(() => null)
    if (m) setTimeout(() => m.delete().catch(() => {}), ms)
  }
  const vc = message.member?.voice?.channel
  if (!vc) return flash(config.color.no, `${E.no} <@${message.author.id}>, entra a un canal de voz primero.`)
  try {
    const res = await client.music.play(message.guild.id, vc.id, message.channel.id, query, message.author)
    if (!res?.result?.tracks?.length) return flash(config.color.no, `🔇 No encontré nada para **${query.slice(0, 80)}**`)
    const info = res.result.tracks[0].info || res.result.tracks[0]
    const added = res.result.loadType === 'playlist' ? `playlist (${res.result.tracks.length} pistas)` : `**${(info.title || query).slice(0, 80)}**`
    return flash(config.color.primary, `${E.music} Añadido: ${added}`, 5000)
  } catch { return flash(config.color.no, '❌ Error al reproducir.') }
}

module.exports = { load, isSetupChannel, getChannelId, getMessageId, create, remove, handleSetupMessage, idlePanel, resetToIdle }
