const { EmbedBuilder } = require('discord.js')
const GiveawaySchema = require('../../database/schemas/GiveawaySchema')

const JOIN_EMOJI = '🎉'

function buildGiveawayEmbed ({ prize, winnerCount, endsAt, hostId, ended }) {
  const endTs = Math.floor(new Date(endsAt).getTime() / 1000)
  const embed = new EmbedBuilder()
    .setTitle(ended ? '🎉 Sorteo finalizado' : '🎉 Sorteo')
    .setColor(ended ? 'Greyple' : 'LuminousVividPink')
    .setDescription([
      `**Premio:** ${prize}`,
      `**Ganadores:** ${winnerCount}`,
      `**Host:** <@${hostId}>`,
      ended ? `**Finalizó:** <t:${endTs}:R>` : `**Finaliza:** <t:${endTs}:R>`,
      '',
      `Reacciona con ${JOIN_EMOJI} para participar.`
    ].join('\n'))
    .setTimestamp()
  return embed
}

async function startGiveaway ({ client, guildID, channel, createdBy, prize, winnerCount, msDuration }) {
  const endsAt = new Date(Date.now() + msDuration)
  const embed = buildGiveawayEmbed({ prize, winnerCount, endsAt, hostId: createdBy, ended: false })
  const message = await channel.send({ embeds: [embed] })
  await message.react(JOIN_EMOJI).catch(() => {})

  const doc = await new GiveawaySchema({
    guildID,
    channelID: channel.id,
    messageID: message.id,
    createdBy,
    prize,
    winnerCount,
    endsAt,
    ended: false
  }).save()

  return { doc, message }
}

async function pickWinners ({ channel, messageID, winnerCount }) {
  const msg = await channel.messages.fetch(messageID)
  const reaction = msg.reactions.cache.get(JOIN_EMOJI)
  if (!reaction) return { winners: [], url: msg.url }

  const users = await reaction.users.fetch()
  const participants = users.filter(u => !u.bot).map(u => u)
  if (!participants.length) return { winners: [], url: msg.url }

  const winners = []
  const max = Math.min(Number(winnerCount) || 1, participants.length)
  while (winners.length < max) {
    const candidate = participants[Math.floor(Math.random() * participants.length)]
    if (!winners.includes(candidate)) winners.push(candidate)
  }
  return { winners, url: msg.url, msg }
}

async function endGiveaway ({ client, guild, giveawayDoc }) {
  if (giveawayDoc.ended) return { winners: [] }
  const channel = guild.channels.cache.get(giveawayDoc.channelID)
  if (!channel) throw new Error('Canal no encontrado.')

  const { winners, url, msg } = await pickWinners({ channel, messageID: giveawayDoc.messageID, winnerCount: giveawayDoc.winnerCount })
  giveawayDoc.ended = true
  await giveawayDoc.save()

  if (msg) {
    const endEmbed = buildGiveawayEmbed({
      prize: giveawayDoc.prize,
      winnerCount: giveawayDoc.winnerCount,
      endsAt: giveawayDoc.endsAt,
      hostId: giveawayDoc.createdBy,
      ended: true
    })
    await msg.edit({ embeds: [endEmbed] }).catch(() => {})
  }

  if (!winners.length) {
    await channel.send(`⚠️ No hubo suficientes participantes para **${giveawayDoc.prize}**.\n${url}`).catch(() => {})
    return { winners: [] }
  }

  await channel.send(`🎉 Ganadores: ${winners.join(', ')}\nPremio: **${giveawayDoc.prize}**\n${url}`).catch(() => {})
  return { winners }
}

async function rerollGiveaway ({ guild, giveawayDoc }) {
  const channel = guild.channels.cache.get(giveawayDoc.channelID)
  if (!channel) throw new Error('Canal no encontrado.')
  const { winners, url } = await pickWinners({ channel, messageID: giveawayDoc.messageID, winnerCount: giveawayDoc.winnerCount })
  if (!winners.length) {
    await channel.send(`⚠️ No hay participantes para reroll de **${giveawayDoc.prize}**.\n${url}`).catch(() => {})
    return { winners: [] }
  }
  await channel.send(`🔁 Reroll ganadores: ${winners.join(', ')}\nPremio: **${giveawayDoc.prize}**\n${url}`).catch(() => {})
  return { winners }
}

module.exports = {
  startGiveaway,
  endGiveaway,
  rerollGiveaway
}
