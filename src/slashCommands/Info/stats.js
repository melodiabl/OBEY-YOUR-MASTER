const { SlashCommandBuilder } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { formatDuration } = require('../../utils/timeFormat')
const { replyEmbed, replyWarn } = require('../../core/ui/interactionKit')
const { headerLine } = require('../../core/ui/uiKit')

function mb (bytes) {
  const n = Number(bytes || 0)
  return (n / 1024 / 1024).toFixed(1)
}

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

function toRel (ms) {
  return `<t:${Math.floor(ms / 1000)}:R>`
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Estadísticas premium (bot / server / user)')
    .addSubcommand(sub => sub
      .setName('bot')
      .setDescription('Estado del bot y sistema')
    )
    .addSubcommand(sub => sub
      .setName('server')
      .setDescription('Estado del servidor')
    )
    .addSubcommand(sub => sub
      .setName('user')
      .setDescription('Estado de un usuario (economía/progreso)')
      .addUserOption(o => o.setName('usuario').setDescription('Usuario (opcional)').setRequired(false))
    ),

  async execute (client, interaction) {
    const sub = interaction.options.getSubcommand()

    if (sub === 'bot') {
      const mem = process.memoryUsage()
      const uptimeMs = Math.floor(process.uptime() * 1000)
      const wsPing = Math.round(Number(client.ws.ping || 0))
      const startedAt = Date.now() - uptimeMs

      return replyEmbed(client, interaction, {
        system: 'infra',
        kind: 'info',
        title: `${Emojis.system} Stats • Bot`,
        description: [
          headerLine(Emojis.system, 'Estado'),
          `${Emojis.dot} ${Emojis.loading} Uptime: ${Format.inlineCode(formatDuration(uptimeMs))} (${toRel(startedAt)})`,
          `${Emojis.dot} ${Emojis.stats} WS Ping: ${Format.inlineCode(`${wsPing}ms`)}`,
          `${Emojis.dot} ${Emojis.inventory} RAM: ${Format.inlineCode(`${mb(mem.rss)} MB RSS`)}`,
          Format.softDivider(20),
          `${Emojis.dot} Slash: ${Format.inlineCode(client.slashCommands.size)}`,
          `${Emojis.dot} Prefix (compat): ${Format.inlineCode(client.commands.size)}`,
          `${Emojis.dot} Servidores: ${Format.inlineCode(client.guilds.cache.size)}`,
          `${Emojis.dot} Usuarios en caché: ${Format.inlineCode(client.users.cache.size)}`
        ].join('\n'),
        thumbnail: client.user.displayAvatarURL({ size: 256 }),
        signature: 'Infra premium'
      }, { ephemeral: true })
    }

    if (sub === 'server') {
      const g = interaction.guild
      const owner = await g.fetchOwner().catch(() => null)
      const createdAt = Math.floor(g.createdAt.getTime() / 1000)
      const boosts = g.premiumSubscriptionCount || 0

      const channelCounts = g.channels?.cache
        ? {
          total: g.channels.cache.size,
          text: g.channels.cache.filter(c => c.isTextBased?.()).size,
          voice: g.channels.cache.filter(c => c.isVoiceBased?.()).size
        }
        : { total: 0, text: 0, voice: 0 }

      return replyEmbed(client, interaction, {
        system: 'info',
        kind: 'info',
        title: `${Emojis.info} Stats • Server`,
        description: [
          headerLine(Emojis.info, g.name),
          `${Emojis.dot} ID: ${Format.inlineCode(g.id)}`,
          `${Emojis.dot} Creado: <t:${createdAt}:R>`,
          owner ? `${Emojis.dot} Owner: ${owner.user}` : null,
          Format.softDivider(20),
          `${Emojis.dot} ${Emojis.member} Miembros: ${Format.inlineCode(g.memberCount)}`,
          `${Emojis.dot} ${Emojis.channel} Canales: ${Format.inlineCode(channelCounts.total)} (txt ${Format.inlineCode(channelCounts.text)} / voz ${Format.inlineCode(channelCounts.voice)})`,
          `${Emojis.dot} ${Emojis.role} Roles: ${Format.inlineCode(g.roles.cache.size)}`,
          `${Emojis.dot} 🚀 Boosts: ${Format.inlineCode(boosts)}`
        ].filter(Boolean).join('\n'),
        thumbnail: g.iconURL({ size: 256 }) || undefined,
        signature: 'Server snapshot'
      }, { ephemeral: true })
    }

    if (sub === 'user') {
      const user = interaction.options.getUser('usuario') || interaction.user
      const member = await interaction.guild.members.fetch(user.id).catch(() => null)
      const userData = await UserSchema.findOne({ userID: user.id }).catch(() => null)

      if (!userData) {
        return replyWarn(client, interaction, {
          system: 'info',
          title: 'Sin datos',
          lines: ['Este usuario todavía no tiene datos guardados.']
        }, { ephemeral: true })
      }

      const level = Number(userData.level || 1)
      const xp = Number(userData.xp || 0)
      const nextLevelXP = level * level * 100

      const now = Date.now()
      const cd = (until) => (until && until > now) ? toRel(until) : `${Emojis.success} Listo`

      return replyEmbed(client, interaction, {
        system: 'info',
        kind: 'info',
        title: `${Emojis.member} Stats • User`,
        description: [
          headerLine(Emojis.member, user.tag || user.username),
          `${Emojis.dot} Usuario: ${user}`,
          `${Emojis.dot} ID: ${Format.inlineCode(user.id)}`,
          member?.joinedAt ? `${Emojis.dot} Entró: ${toRel(member.joinedAt.getTime())}` : null,
          Format.softDivider(20),
          `${Emojis.dot} ${Emojis.economy} Efectivo: ${Format.inlineCode(money(userData.money || 0))}`,
          `${Emojis.dot} ${Emojis.bank} Banco: ${Format.inlineCode(money(userData.bank || 0))}`,
          `${Emojis.dot} ${Emojis.inventory} Inventario: ${Format.inlineCode(Array.isArray(userData.inventory) ? userData.inventory.length : 0)}`,
          Format.softDivider(20),
          `${Emojis.dot} ${Emojis.level} Nivel: ${Format.inlineCode(level)}`,
          `${Emojis.dot} ${Emojis.stats} XP: ${Format.inlineCode(`${xp} / ${nextLevelXP}`)} ${Format.progressBar(Math.min(xp, nextLevelXP), nextLevelXP || 1, 15)}`,
          `${Emojis.dot} ✨ Rep: ${Format.inlineCode(userData.reputation || 0)}`,
          Format.softDivider(20),
          `${Emojis.dot} ${Emojis.giveaway} Daily: ${cd(userData.dailyCooldown)}`,
          `${Emojis.dot} ${Emojis.work} Work: ${cd(userData.workCooldown)}`
        ].filter(Boolean).join('\n'),
        thumbnail: user.displayAvatarURL({ size: 256 }),
        signature: 'Stats sincronizadas'
      }, { ephemeral: true })
    }
  }
}
