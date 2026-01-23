const GiveawaySchema = require('../../database/schemas/GiveawaySchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, embed, headerLine, warnEmbed } = require('../../core/ui/uiKit')

const JOIN_EMOJI = '🎉'

function endTimestamp (endsAt) {
  const ms = new Date(endsAt).getTime()
  return Math.floor(ms / 1000)
}

async function buildGiveawayEmbed ({ client, guildId, prize, winnerCount, endsAt, hostId, ended }) {
  const ui = await getGuildUiConfig(client, guildId)
  const endTs = endTimestamp(endsAt)

  return embed({
    ui,
    system: 'events',
    kind: ended ? 'neutral' : 'info',
    title: ended ? `${Emojis.giveaway} Sorteo finalizado` : `${Emojis.giveaway} Sorteo`,
    description: [
      headerLine(Emojis.giveaway, ended ? 'Resultado' : 'Participa'),
      `${Emojis.dot} **Premio:** ${Format.bold(prize)}`,
      `${Emojis.dot} **Ganadores:** ${Format.inlineCode(winnerCount)}`,
      `${Emojis.dot} **Host:** <@${hostId}>`,
      ended ? `${Emojis.dot} **Finalizó:** <t:${endTs}:R>` : `${Emojis.dot} **Finaliza:** <t:${endTs}:R>`,
      Format.softDivider(20),
      ended
        ? `${Emojis.dot} ${Format.italic('Gracias por participar.')}`
        : `${Emojis.dot} Reacciona con ${JOIN_EMOJI} para participar.`
    ].join('\n'),
    signature: ended ? 'Nos vemos en el próximo' : 'Suerte 🍀'
  })
}

async function startGiveaway ({ client, guildID, channel, createdBy, prize, winnerCount, msDuration }) {
  const endsAt = new Date(Date.now() + msDuration)
  const e = await buildGiveawayEmbed({ client, guildId: guildID, prize, winnerCount, endsAt, hostId: createdBy, ended: false })
  const message = await channel.send({ embeds: [e] })
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
  if (!reaction) return { winners: [], url: msg.url, msg }

  const users = await reaction.users.fetch()
  const participants = users.filter(u => !u.bot).map(u => u)
  if (!participants.length) return { winners: [], url: msg.url, msg }

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
    const endEmbed = await buildGiveawayEmbed({
      client,
      guildId: guild.id,
      prize: giveawayDoc.prize,
      winnerCount: giveawayDoc.winnerCount,
      endsAt: giveawayDoc.endsAt,
      hostId: giveawayDoc.createdBy,
      ended: true
    })
    await msg.edit({ embeds: [endEmbed] }).catch(() => {})
  }

  const ui = await getGuildUiConfig(client, guild.id)

  if (!winners.length) {
    const e = warnEmbed({
      ui,
      system: 'events',
      title: 'Sin participantes',
      lines: [
        `${Emojis.dot} No hubo suficientes participantes para ${Format.bold(giveawayDoc.prize)}.`,
        `${Emojis.dot} Link: ${url}`
      ]
    })
    await channel.send({ embeds: [e] }).catch(() => {})
    return { winners: [] }
  }

  const e = embed({
    ui,
    system: 'events',
    kind: 'success',
    title: `${Emojis.giveaway} Ganadores`,
    description: [
      headerLine(Emojis.giveaway, 'Resultado'),
      `${Emojis.dot} **Premio:** ${Format.bold(giveawayDoc.prize)}`,
      `${Emojis.dot} **Ganadores:** ${winners.map(w => w.toString()).join(', ')}`,
      `${Emojis.dot} Link: ${url}`
    ].join('\n'),
    signature: 'Felicidades'
  })
  await channel.send({ embeds: [e] }).catch(() => {})
  return { winners }
}

async function rerollGiveaway ({ client, guild, giveawayDoc }) {
  const channel = guild.channels.cache.get(giveawayDoc.channelID)
  if (!channel) throw new Error('Canal no encontrado.')
  const { winners, url } = await pickWinners({ channel, messageID: giveawayDoc.messageID, winnerCount: giveawayDoc.winnerCount })

  const ui = await getGuildUiConfig(client, guild.id)

  if (!winners.length) {
    const e = warnEmbed({
      ui,
      system: 'events',
      title: 'Reroll sin participantes',
      lines: [
        `${Emojis.dot} No hay participantes para reroll de ${Format.bold(giveawayDoc.prize)}.`,
        `${Emojis.dot} Link: ${url}`
      ]
    })
    await channel.send({ embeds: [e] }).catch(() => {})
    return { winners: [] }
  }

  const e = embed({
    ui,
    system: 'events',
    kind: 'info',
    title: `${Emojis.loop} Reroll`,
    description: [
      headerLine(Emojis.giveaway, 'Nuevos ganadores'),
      `${Emojis.dot} **Premio:** ${Format.bold(giveawayDoc.prize)}`,
      `${Emojis.dot} **Ganadores:** ${winners.map(w => w.toString()).join(', ')}`,
      `${Emojis.dot} Link: ${url}`
    ].join('\n'),
    signature: 'Buena suerte'
  })
  await channel.send({ embeds: [e] }).catch(() => {})
  return { winners }
}

module.exports = {
  startGiveaway,
  endGiveaway,
  rerollGiveaway
}

