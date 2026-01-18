const { ChannelType, PermissionsBitField } = require('discord.js')
const GuildSchema = require('../../database/schemas/GuildSchema')
const TicketSchema = require('../../database/schemas/TicketSchema')

async function nextTicketNumber (guildID) {
  const doc = await GuildSchema.findOneAndUpdate(
    { guildID },
    { $inc: { ticketCounter: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  return doc.ticketCounter
}

function buildOverwrites ({ guild, openerId, supportRoleId, botUserId }) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel]
    },
    {
      id: openerId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.EmbedLinks
      ]
    },
    {
      id: botUserId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    }
  ]

  if (supportRoleId) {
    overwrites.push({
      id: supportRoleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageMessages
      ]
    })
  }

  return overwrites
}

async function findOpenTicketByUser ({ guildID, userID }) {
  return TicketSchema.findOne({ guildID, createdBy: userID, status: 'OPEN' })
}

async function getTicketByChannel ({ guildID, channelID }) {
  return TicketSchema.findOne({ guildID, channelID })
}

async function openTicket ({ client, guild, opener, topic }) {
  const guildData = await client.db.getGuildData(guild.id)
  const existing = await findOpenTicketByUser({ guildID: guild.id, userID: opener.id })
  if (existing) throw new Error(`Ya tienes un ticket abierto: <#${existing.channelID}>`)

  const ticketNumber = await nextTicketNumber(guild.id)
  const name = `ticket-${ticketNumber}`

  const channel = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: guildData.ticketsCategory || undefined,
    topic: `Ticket #${ticketNumber} | Owner: ${opener.id}${topic ? ` | ${topic}` : ''}`,
    permissionOverwrites: buildOverwrites({
      guild,
      openerId: opener.id,
      supportRoleId: guildData.ticketsSupportRole,
      botUserId: client.user.id
    })
  })

  const doc = new TicketSchema({
    guildID: guild.id,
    ticketNumber,
    channelID: channel.id,
    createdBy: opener.id,
    status: 'OPEN',
    topic: topic || null,
    priority: 'med',
    notes: []
  })
  await doc.save()

  return { ticketNumber, channel }
}

async function closeTicket ({ guildID, channelID, closedBy, channel = null, deleteChannel = true, deleteDelayMs = 2500 }) {
  const ticket = await TicketSchema.findOne({ guildID, channelID, status: 'OPEN' })
  if (!ticket) throw new Error('Este canal no corresponde a un ticket abierto.')

  ticket.status = 'CLOSED'
  ticket.closedAt = new Date()
  if (!ticket.claimedBy) ticket.claimedBy = closedBy
  await ticket.save()

  if (deleteChannel && channel && String(channel.id) === String(channelID) && typeof channel.delete === 'function') {
    const ms = Math.max(0, Number(deleteDelayMs) || 0)
    const t = setTimeout(() => {
      channel.delete(`Ticket #${ticket.ticketNumber} cerrado`).catch(() => {})
    }, ms)
    t.unref?.()
  }

  return ticket
}

async function claimTicket ({ guildID, channelID, userID }) {
  const ticket = await TicketSchema.findOne({ guildID, channelID, status: 'OPEN' })
  if (!ticket) throw new Error('Este canal no corresponde a un ticket abierto.')
  if (ticket.claimedBy && ticket.claimedBy !== userID) throw new Error('Este ticket ya está claimado por otra persona.')

  ticket.claimedBy = userID
  await ticket.save()
  return ticket
}

async function unclaimTicket ({ guildID, channelID, userID }) {
  const ticket = await TicketSchema.findOne({ guildID, channelID, status: 'OPEN' })
  if (!ticket) throw new Error('Este canal no corresponde a un ticket abierto.')
  if (!ticket.claimedBy) throw new Error('Este ticket no está claimado.')
  if (ticket.claimedBy !== userID) throw new Error('Solo quien lo claimó puede unclaimarlo.')
  ticket.claimedBy = null
  await ticket.save()
  return ticket
}

async function transferTicket ({ guildID, channelID, fromUserID, toUserID }) {
  const ticket = await TicketSchema.findOne({ guildID, channelID, status: 'OPEN' })
  if (!ticket) throw new Error('Este canal no corresponde a un ticket abierto.')
  if (!ticket.claimedBy) throw new Error('Este ticket no está claimado.')
  if (ticket.claimedBy !== fromUserID) throw new Error('Solo quien lo claimó puede transferirlo.')
  ticket.claimedBy = toUserID
  await ticket.save()
  return ticket
}

async function setTicketPriority ({ guildID, channelID, priority }) {
  const p = String(priority || '').toLowerCase()
  if (!['low', 'med', 'high'].includes(p)) throw new Error('Prioridad inválida: low|med|high.')
  const ticket = await getTicketByChannel({ guildID, channelID })
  if (!ticket) throw new Error('Este canal no corresponde a un ticket.')
  ticket.priority = p
  await ticket.save()
  return ticket
}

async function addTicketNote ({ guildID, channelID, authorID, text }) {
  const t = String(text || '').trim()
  if (!t) throw new Error('Nota vacía.')
  if (t.length > 800) throw new Error('Nota demasiado larga (máx 800).')
  const ticket = await getTicketByChannel({ guildID, channelID })
  if (!ticket) throw new Error('Este canal no corresponde a un ticket.')
  ticket.notes = Array.isArray(ticket.notes) ? ticket.notes : []
  ticket.notes.push({ authorID, text: t, createdAt: new Date() })
  await ticket.save()
  return ticket
}

async function listTicketNotes ({ guildID, channelID, limit = 10 }) {
  const ticket = await getTicketByChannel({ guildID, channelID })
  if (!ticket) throw new Error('Este canal no corresponde a un ticket.')
  const notes = Array.isArray(ticket.notes) ? ticket.notes : []
  const lim = Math.max(1, Math.min(50, Number(limit) || 10))
  return notes.slice(-lim).reverse()
}

async function addUserToTicket ({ channel, userID }) {
  await channel.permissionOverwrites.edit(userID, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
    AttachFiles: true,
    EmbedLinks: true
  })
  return true
}

async function removeUserFromTicket ({ channel, userID }) {
  await channel.permissionOverwrites.delete(userID)
  return true
}

module.exports = {
  openTicket,
  closeTicket,
  claimTicket,
  unclaimTicket,
  transferTicket,
  setTicketPriority,
  addTicketNote,
  listTicketNotes,
  addUserToTicket,
  removeUserFromTicket,
  getTicketByChannel
}
