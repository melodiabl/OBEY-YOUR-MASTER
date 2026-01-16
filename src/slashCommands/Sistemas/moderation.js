const { EmbedBuilder } = require('discord.js')
const ms = require('ms')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { warnUser, timeoutUser, logAction, getUserHistory } = require('../../systems/moderation/moderationService')

module.exports = createSystemSlashCommand({
  name: 'moderation',
  description: 'Moderación y sanciones (base)',
  moduleKey: 'moderation',
  defaultCooldownMs: 2_000,
  subcommands: [
    {
      name: 'warn',
      description: 'Advierte a un usuario',
      options: [
        {
          apply: (sc) =>
            sc
              .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
              .addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false))
        }
      ],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('usuario', true)
        const reason = interaction.options.getString('razon') || 'Sin razón.'
        if (target.bot) return interaction.reply({ content: 'No puedes advertir bots.', ephemeral: true })

        const modCase = await warnUser({
          guildID: interaction.guild.id,
          targetID: target.id,
          moderatorID: interaction.user.id,
          reason
        })

        const embed = new EmbedBuilder()
          .setTitle('⚠️ Warn aplicado')
          .setColor('Yellow')
          .addFields(
            { name: 'Caso', value: `#${modCase.caseNumber}`, inline: true },
            { name: 'Usuario', value: `<@${target.id}>`, inline: true },
            { name: 'Moderador', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Razón', value: reason }
          )
          .setTimestamp()

        await interaction.reply({ embeds: [embed] })

        try {
          await target.send(`Has recibido un warn en **${interaction.guild.name}**.\nRazón: ${reason}`)
        } catch (e) {}
      }
    },
    {
      name: 'kick',
      description: 'Expulsa a un miembro',
      options: [
        {
          apply: (sc) =>
            sc
              .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
              .addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false))
        }
      ],
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
        return interaction.reply({ content: `✅ Kick aplicado a <@${targetUser.id}>. Caso #${modCase.caseNumber}.`, ephemeral: false })
      }
    },
    {
      name: 'ban',
      description: 'Banea a un usuario',
      options: [
        {
          apply: (sc) =>
            sc
              .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
              .addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false))
        }
      ],
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
        return interaction.reply({ content: `✅ Ban aplicado a <@${targetUser.id}>. Caso #${modCase.caseNumber}.`, ephemeral: false })
      }
    },
    {
      name: 'unban',
      description: 'Desbanea por userId',
      options: [
        {
          apply: (sc) =>
            sc
              .addStringOption(o => o.setName('user_id').setDescription('ID del usuario').setRequired(true))
              .addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false))
        }
      ],
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
        return interaction.reply({ content: `✅ Unban aplicado a <@${userId}>. Caso #${modCase.caseNumber}.`, ephemeral: false })
      }
    },
    {
      name: 'timeout',
      description: 'Aplica timeout a un miembro',
      options: [
        {
          apply: (sc) =>
            sc
              .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
              .addStringOption(o => o.setName('duracion').setDescription('Duración (ej: 10m, 1h)').setRequired(true))
              .addStringOption(o => o.setName('razon').setDescription('Razón (opcional)').setRequired(false))
        }
      ],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const targetUser = interaction.options.getUser('usuario', true)
        const durationStr = interaction.options.getString('duracion', true)
        const reason = interaction.options.getString('razon') || 'Sin razón.'

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null)
        if (!member) return interaction.reply({ content: 'No pude obtener al miembro.', ephemeral: true })
        if (!member.moderatable) return interaction.reply({ content: 'No puedo aplicar timeout a ese usuario (jerarquía/permisos).', ephemeral: true })

        const durationMs = ms(durationStr)
        if (!durationMs || durationMs < 5_000) return interaction.reply({ content: 'Duración inválida. Ejemplos: 10m, 1h, 2d', ephemeral: true })

        await member.timeout(durationMs, reason).catch((e) => { throw e })
        const modCase = await timeoutUser({
          guildID: interaction.guild.id,
          targetID: targetUser.id,
          moderatorID: interaction.user.id,
          reason,
          durationMs
        })

        return interaction.reply({ content: `✅ Timeout aplicado a <@${targetUser.id}> (${durationStr}). Caso #${modCase.caseNumber}.`, ephemeral: false })
      }
    },
    {
      name: 'purge',
      description: 'Borra mensajes del canal (bulk)',
      options: [
        {
          apply: (sc) =>
            sc
              .addIntegerOption(o => o.setName('cantidad').setDescription('1-100').setRequired(true).setMinValue(1).setMaxValue(100))
              .addUserOption(o => o.setName('usuario').setDescription('Filtra por usuario (opcional)').setRequired(false))
        }
      ],
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

        return interaction.reply({ content: `✅ Borrados **${deleted.size}** mensajes.`, ephemeral: true })
      }
    },
    {
      name: 'history',
      description: 'Muestra historial de moderación de un usuario',
      options: [
        {
          apply: (sc) =>
            sc
              .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
              .addIntegerOption(o => o.setName('limite').setDescription('Máx 20').setRequired(false).setMinValue(1).setMaxValue(20))
        }
      ],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('usuario', true)
        const limit = interaction.options.getInteger('limite') || 10
        const data = await getUserHistory({ guildID: interaction.guild.id, targetID: target.id, limit })

        if (!data.cases.length) {
          return interaction.reply({ content: `No hay casos registrados para <@${target.id}>. Warns actuales: **${data.warnsCount}**`, ephemeral: true })
        }

        const lines = data.cases.map(c => {
          const ts = `<t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>`
          return `#${c.caseNumber} \`${c.type}\` ${ts} por <@${c.moderatorID}>`
        })

        const embed = new EmbedBuilder()
          .setTitle(`📜 Historial de <@${target.id}>`)
          .setColor('Blurple')
          .setDescription(lines.join('\n'))
          .addFields({ name: 'Warns (UserSchema)', value: String(data.warnsCount), inline: true })
          .setTimestamp()

        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    }
  ]
})
