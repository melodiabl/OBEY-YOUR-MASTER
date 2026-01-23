const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const Emojis = require('../utils/emojis')

function ctlId (action, ownerId) {
  return `music:ctl:${action}:${ownerId}`
}

function buildMusicControls ({ ownerId, state } = {}) {
  const paused = Boolean(state?.isPaused)
  const toggleLabel = paused ? 'Reanudar' : 'Pausar'
  const toggleEmoji = paused ? Emojis.play : Emojis.pause

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(ctlId('toggle', ownerId))
      .setStyle(ButtonStyle.Primary)
      .setLabel(toggleLabel)
      .setEmoji(toggleEmoji),
    new ButtonBuilder()
      .setCustomId(ctlId('skip', ownerId))
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Skip')
      .setEmoji(Emojis.skip),
    new ButtonBuilder()
      .setCustomId(ctlId('stop', ownerId))
      .setStyle(ButtonStyle.Danger)
      .setLabel('Stop')
      .setEmoji(Emojis.stop),
    new ButtonBuilder()
      .setCustomId(ctlId('loop', ownerId))
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Loop')
      .setEmoji(Emojis.loop),
    new ButtonBuilder()
      .setCustomId(ctlId('shuffle', ownerId))
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Shuffle')
      .setEmoji(Emojis.shuffle)
  )

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(ctlId('queue', ownerId))
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Cola')
      .setEmoji(Emojis.music),
    new ButtonBuilder()
      .setCustomId(ctlId('refresh', ownerId))
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Refresh')
      .setEmoji(Emojis.loading)
  )

  return [row1, row2]
}

function pickId (token, ownerId) {
  return `music:pick:${token}:${ownerId}`
}

module.exports = {
  buildMusicControls,
  pickId
}

