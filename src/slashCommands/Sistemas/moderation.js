const { EmbedBuilder } = require('discord.js')
const ms = require('ms')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { warnUser, unwarnUser, timeoutUser, logAction, getUserHistory } = require('../../systems/moderation/moderationService')
const { handleWarnThresholdKick } = require('../../systems/moderation/warnThresholdService')

module.exports = createSystemSlashCommand({
  name: 'moderation',
  description: 'Moderación y sanciones (alto volumen)',
  moduleKey: 'moderation',
  defaultCooldownMs: 2_000,
  subcommands: [
    {
      name: 'warn',
      description: 'Advierte a un usuario',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)).addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('usuario', true)
        const reason = interaction.options.getString('razon') || 'Sin razón.'
        if (target.bot) return interaction.reply({ content: 'No puedes advertir bots.', ephemeral: true })

        const res = await warnUser({
          guildID: interaction.guild.id,
          targetID: target.id,
          moderatorID: interaction.user.id,
          reason
        })

        const embed = new EmbedBuilder()
          .setTitle('Warn aplicado')
          .setColor('Yellow')
          .addFields(
            { name: 'Caso', value: `#${res.case.caseNumber}`, inline: true },
            { name: 'Usuario', value: `<@${target.id}>`, inline: true },
            { name: 'Moderador', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Razón', value: reason }
          )
          .setTimestamp()

        await interaction.reply({ embeds: [embed] })

        // Política: 3 warns => kick (base).
        try {
          const policy = await handleWarnThresholdKick({
            client,
            guild: interaction.guild,
            targetID: target.id,
            moderatorID: interaction.user.id,
            warnsCount: res.warnsCount,
            threshold: 3
          })
          if (policy.triggered && !policy.kicked && policy.reason) {
            await interaction.followUp({ content: `Llegó a 3 warns, pero no pude kickear: ${policy.reason}`, ephemeral: true })
          }
          if (policy.kicked) {
            await interaction.followUp({ content: `ƒo. Auto-kick aplicado a <@${target.id}> por llegar a **3** warns.`, ephemeral: false })
          }
        } catch (e) {
          await interaction.followUp({ content: `Llegó a 3 warns, pero falló el auto-kick: ${e?.message || e}`, ephemeral: true })
        }

        try {
          await target.send(`Has recibido un warn en **${interaction.guild.name}**.\nRazón: ${reason}`)
        } catch (e) {}
      }
    },
    {
      name: 'unwarn',
      description: 'Quita un warn (último o por índice)',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)).addIntegerOption(o => o.setName('indice').setDescription('Índice (1 = más viejo)').setRequired(false).setMinValue(1)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      cooldownMs: 2_000,
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('usuario', true)
        const index = interaction.options.getInteger('indice')
        if (target.bot) return interaction.reply({ content: 'Los bots no tienen warns.', ephemeral: true })

        const res = await unwarnUser({
          guildID: interaction.guild.id,
          targetID: target.id,
          moderatorID: interaction.user.id,
          index
        })

        const extra = index ? ` (índice ${index})` : ' (último)'
        return interaction.reply({
          content: `ƒo. Warn removido de <@${target.id}>${extra}. Warns restantes: **${res.remaining}**.`,
          ephemeral: true
        })
      }
    },
    {
      name: 'warns',
      description: 'Lista warns actuales de un usuario',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('usuario', true)
        const UserSchema = require('../../database/schemas/UserSchema')
        const doc = await UserSchema.findOne({ userID: target.id })
        const warns = Array.isArray(doc?.warns) ? doc.warns : []
        if (!warns.length) return interaction.reply({ content: 'No tiene warns.', ephemeral: true })
        const lines = warns.slice(0, 15).map((w, idx) => {
          const ts = w?.date ? `<t:${Math.floor(new Date(w.date).getTime() / 1000)}:R>` : ''
          return `**${idx + 1}.** ${ts} por <@${w.moderator}> — ${w.reason || 'Sin razón'}`
        })
        const embed = new EmbedBuilder().setTitle(`Warns • ${target.username}`).setColor('Yellow').setDescription(lines.join('\n')).setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'clearwarns',
      description: 'Limpia todos los warns de un usuario',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)) }],
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [] },
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('usuario', true)
        const UserSchema = require('../../database/schemas/UserSchema')
        await UserSchema.updateOne({ userID: target.id }, { $set: { warns: [] } }, { upsert: true })
        const modCase = await logAction({
          guildID: interaction.guild.id,
          type: 'clearwarns',
          targetID: target.id,
          moderatorID: interaction.user.id,
          reason: 'clearwarns'
        })
        return interaction.reply({ content: `ƒo. Warns limpiados para <@${target.id}>. Caso #${modCase.caseNumber}.`, ephemeral: true })
      }
    },
    {
      name: 'kick',
      description: 'Expulsa a un miembro',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)).addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const targetUser = interaction.options.getUser('usuario', true)
        const reason = interaction.options.getString('razon') || 'Sin razón.'
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null)
        if (!member) return interaction.reply({ content: 'No pude obtener al miembro.', ephemeral: true })
        if (!member.kickable) return interaction.reply({ content: 'No puedo kickear a ese usuario (jerarquía/permisos).', ephemeral: true })

        await member.kick(reason)
        const modCase = await logAction({
          guildID: interaction.guild.id,
          type: 'kick',
          targetID: targetUser.id,
          moderatorID: interaction.user.id,
          reason
        })
        return interaction.reply({ content: `ƒo. Kick aplicado a <@${targetUser.id}>. Caso #${modCase.caseNumber}.`, ephemeral: false })
      }
    },
    {
      name: 'ban',
      description: 'Banea a un usuario',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)).addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const targetUser = interaction.options.getUser('usuario', true)
        const reason = interaction.options.getString('razon') || 'Sin razón.'
        await interaction.guild.members.ban(targetUser.id, { reason }).catch((e) => { throw e })
        const modCase = await logAction({
          guildID: interaction.guild.id,
          type: 'ban',
          targetID: targetUser.id,
          moderatorID: interaction.user.id,
          reason
        })
        return interaction.reply({ content: `ƒo. Ban aplicado a <@${targetUser.id}>. Caso #${modCase.caseNumber}.`, ephemeral: false })
      }
    },
    {
      name: 'unban',
      description: 'Desbanea por userId',
      options: [{ apply: (sc) => sc.addStringOption(o => o.setName('user_id').setDescription('ID del usuario').setRequired(true)).addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const userId = interaction.options.getString('user_id', true)
        const reason = interaction.options.getString('razon') || 'Sin razón.'
        await interaction.guild.bans.remove(userId, reason).catch((e) => { throw e })
        const modCase = await logAction({
          guildID: interaction.guild.id,
          type: 'unban',
          targetID: userId,
          moderatorID: interaction.user.id,
          reason
        })
        return interaction.reply({ content: `ƒo. Unban aplicado a <@${userId}>. Caso #${modCase.caseNumber}.`, ephemeral: false })
      }
    },
    {
      name: 'timeout',
      description: 'Aplica timeout a un miembro',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)).addStringOption(o => o.setName('duracion').setDescription('Duración (ej: 10m, 1h)').setRequired(true)).addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const targetUser = interaction.options.getUser('usuario', true)
        const durationStr = interaction.options.getString('duracion', true)
        const reason = interaction.options.getString('razon') || 'Sin razón.'

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null)
        if (!member) return interaction.reply({ content: 'No pude obtener al miembro.', ephemeral: true })
        if (!member.moderatable) return interaction.reply({ content: 'No puedo aplicar timeout (jerarquía/permisos).', ephemeral: true })

        const durationMs = ms(durationStr)
        if (!durationMs || durationMs < 5_000) return interaction.reply({ content: 'Duración inválida. Ej: 10m, 1h, 2d', ephemeral: true })

        await member.timeout(durationMs, reason).catch((e) => { throw e })
        const modCase = await timeoutUser({
          guildID: interaction.guild.id,
          targetID: targetUser.id,
          moderatorID: interaction.user.id,
          reason,
          durationMs
        })

        return interaction.reply({ content: `ƒo. Timeout aplicado a <@${targetUser.id}> (${durationStr}). Caso #${modCase.caseNumber}.`, ephemeral: false })
      }
    },
    {
      name: 'untimeout',
      description: 'Quita timeout a un miembro',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)).addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const targetUser = interaction.options.getUser('usuario', true)
        const reason = interaction.options.getString('razon') || 'Sin razón.'
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null)
        if (!member) return interaction.reply({ content: 'No pude obtener al miembro.', ephemeral: true })
        if (!member.moderatable) return interaction.reply({ content: 'No puedo quitar timeout (jerarquía/permisos).', ephemeral: true })

        await member.timeout(null, reason).catch((e) => { throw e })
        const modCase = await logAction({
          guildID: interaction.guild.id,
          type: 'untimeout',
          targetID: targetUser.id,
          moderatorID: interaction.user.id,
          reason
        })
        return interaction.reply({ content: `ƒo. Timeout removido de <@${targetUser.id}>. Caso #${modCase.caseNumber}.`, ephemeral: false })
      }
    },
    {
      name: 'purge',
      description: 'Borra mensajes del canal (bulk)',
      options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('cantidad').setDescription('1-100').setRequired(true).setMinValue(1).setMaxValue(100)).addUserOption(o => o.setName('usuario').setDescription('Filtra por usuario (opcional)').setRequired(false)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      cooldownMs: 5_000,
      handler: async (client, interaction) => {
        const amount = interaction.options.getInteger('cantidad', true)
        const user = interaction.options.getUser('usuario')
        const messages = await interaction.channel.messages.fetch({ limit: 100 })
        const toDelete = user ? messages.filter(m => m.author?.id === user.id).first(amount) : messages.first(amount)

        const deleted = await interaction.channel.bulkDelete(toDelete, true).catch((e) => { throw e })
        await logAction({
          guildID: interaction.guild.id,
          type: 'purge',
          targetID: user?.id || interaction.channel.id,
          moderatorID: interaction.user.id,
          reason: user ? `purge user ${user.id}` : 'purge',
          meta: { deleted: deleted?.size || 0, channelID: interaction.channel.id }
        })

        return interaction.reply({ content: `ƒo. Borrados **${deleted.size}** mensajes.`, ephemeral: true })
      }
    },
    {
      name: 'slowmode',
      description: 'Set slowmode del canal actual',
      options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('segundos').setDescription('0-21600').setRequired(true).setMinValue(0).setMaxValue(21600)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const seconds = interaction.options.getInteger('segundos', true)
        await interaction.channel.setRateLimitPerUser(seconds).catch((e) => { throw e })
        const modCase = await logAction({
          guildID: interaction.guild.id,
          type: 'slowmode',
          targetID: interaction.channel.id,
          moderatorID: interaction.user.id,
          reason: `slowmode ${seconds}`,
          meta: { seconds }
        })
        return interaction.reply({ content: `ƒo. Slowmode: **${seconds}s**. Caso #${modCase.caseNumber}.`, ephemeral: true })
      }
    },
    {
      name: 'lock',
      description: 'Bloquea el canal (no enviar mensajes)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { SendMessages: false }).catch((e) => { throw e })
        const modCase = await logAction({
          guildID: interaction.guild.id,
          type: 'lock',
          targetID: interaction.channel.id,
          moderatorID: interaction.user.id,
          reason: 'lock channel'
        })
        return interaction.reply({ content: `ƒo. Canal bloqueado. Caso #${modCase.caseNumber}.`, ephemeral: true })
      }
    },
    {
      name: 'unlock',
      description: 'Desbloquea el canal (restaura enviar mensajes)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { SendMessages: null }).catch((e) => { throw e })
        const modCase = await logAction({
          guildID: interaction.guild.id,
          type: 'unlock',
          targetID: interaction.channel.id,
          moderatorID: interaction.user.id,
          reason: 'unlock channel'
        })
        return interaction.reply({ content: `ƒo. Canal desbloqueado. Caso #${modCase.caseNumber}.`, ephemeral: true })
      }
    },
    {
      name: 'nick',
      description: 'Cambia el apodo de un miembro',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)).addStringOption(o => o.setName('apodo').setDescription('Nuevo apodo (vacío = reset)').setRequired(false).setMaxLength(32)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const targetUser = interaction.options.getUser('usuario', true)
        const nick = interaction.options.getString('apodo') || null
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null)
        if (!member) return interaction.reply({ content: 'No pude obtener al miembro.', ephemeral: true })
        if (!member.manageable) return interaction.reply({ content: 'No puedo cambiar su apodo (jerarquía/permisos).', ephemeral: true })
        await member.setNickname(nick, `moderation nick by ${interaction.user.id}`).catch((e) => { throw e })
        const modCase = await logAction({
          guildID: interaction.guild.id,
          type: 'nick',
          targetID: targetUser.id,
          moderatorID: interaction.user.id,
          reason: nick ? `nick -> ${nick}` : 'nick reset'
        })
        return interaction.reply({ content: `ƒo. Apodo actualizado para <@${targetUser.id}>. Caso #${modCase.caseNumber}.`, ephemeral: true })
      }
    },
    {
      name: 'role_add',
      description: 'Agrega un rol a un miembro',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)).addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(true)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const targetUser = interaction.options.getUser('usuario', true)
        const role = interaction.options.getRole('rol', true)
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null)
        if (!member) return interaction.reply({ content: 'No pude obtener al miembro.', ephemeral: true })
        await member.roles.add(role.id).catch((e) => { throw e })
        const modCase = await logAction({
          guildID: interaction.guild.id,
          type: 'role_add',
          targetID: targetUser.id,
          moderatorID: interaction.user.id,
          reason: `add role ${role.id}`,
          meta: { roleId: role.id }
        })
        return interaction.reply({ content: `ƒo. Rol <@&${role.id}> agregado a <@${targetUser.id}>. Caso #${modCase.caseNumber}.`, ephemeral: true })
      }
    },
    {
      name: 'role_remove',
      description: 'Quita un rol a un miembro',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)).addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(true)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const targetUser = interaction.options.getUser('usuario', true)
        const role = interaction.options.getRole('rol', true)
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null)
        if (!member) return interaction.reply({ content: 'No pude obtener al miembro.', ephemeral: true })
        await member.roles.remove(role.id).catch((e) => { throw e })
        const modCase = await logAction({
          guildID: interaction.guild.id,
          type: 'role_remove',
          targetID: targetUser.id,
          moderatorID: interaction.user.id,
          reason: `remove role ${role.id}`,
          meta: { roleId: role.id }
        })
        return interaction.reply({ content: `ƒo. Rol <@&${role.id}> removido de <@${targetUser.id}>. Caso #${modCase.caseNumber}.`, ephemeral: true })
      }
    },
    {
      name: 'case',
      description: 'Ver un caso por número',
      options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('numero').setDescription('Case #').setRequired(true).setMinValue(1)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const n = interaction.options.getInteger('numero', true)
        const ModerationCaseSchema = require('../../database/schemas/ModerationCaseSchema')
        const c = await ModerationCaseSchema.findOne({ guildID: interaction.guild.id, caseNumber: n })
        if (!c) return interaction.reply({ content: 'Caso no encontrado.', ephemeral: true })
        const embed = new EmbedBuilder()
          .setTitle(`Caso #${c.caseNumber}`)
          .setColor('Blurple')
          .addFields(
            { name: 'Tipo', value: c.type, inline: true },
            { name: 'Actor', value: `<@${c.moderatorID}>`, inline: true },
            { name: 'Objetivo', value: `<@${c.targetID}>`, inline: true },
            { name: 'Razón', value: c.reason || 'Sin razón' }
          )
          .setTimestamp(new Date(c.createdAt))
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'cases',
      description: 'Lista casos recientes del servidor',
      options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('limite').setDescription('Máx 20').setRequired(false).setMinValue(1).setMaxValue(20)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const limit = interaction.options.getInteger('limite') || 10
        const ModerationCaseSchema = require('../../database/schemas/ModerationCaseSchema')
        const rows = await ModerationCaseSchema.find({ guildID: interaction.guild.id }).sort({ createdAt: -1 }).limit(limit)
        if (!rows.length) return interaction.reply({ content: 'No hay casos aún.', ephemeral: true })
        const lines = rows.map(c => `#${c.caseNumber} \`${c.type}\` <t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R> por <@${c.moderatorID}>`)
        const embed = new EmbedBuilder().setTitle('Casos recientes').setColor('Blurple').setDescription(lines.join('\n')).setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'history',
      description: 'Historial de moderación de un usuario',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)).addIntegerOption(o => o.setName('limite').setDescription('Máx 20').setRequired(false).setMinValue(1).setMaxValue(20)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('usuario', true)
        const limit = interaction.options.getInteger('limite') || 10
        const data = await getUserHistory({ guildID: interaction.guild.id, targetID: target.id, limit })

        if (!data.cases.length) {
          return interaction.reply({ content: `No hay casos para <@${target.id}>. Warns actuales: **${data.warnsCount}**`, ephemeral: true })
        }

        const lines = data.cases.map(c => {
          const ts = `<t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>`
          return `#${c.caseNumber} \`${c.type}\` ${ts} por <@${c.moderatorID}>`
        })

        const embed = new EmbedBuilder()
          .setTitle(`Historial • <@${target.id}>`)
          .setColor('Blurple')
          .setDescription(lines.join('\n'))
          .addFields({ name: 'Warns (UserSchema)', value: String(data.warnsCount), inline: true })
          .setTimestamp()

        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    }
  ]
})

