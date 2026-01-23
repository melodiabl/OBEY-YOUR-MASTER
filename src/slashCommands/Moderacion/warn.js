const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const { warnUser, handleWarnThresholdKick } = require('../../systems').moderation
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/interactionKit')
const { getGuildUiConfig, warnEmbed, okEmbed } = require('../../core/ui/uiKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Advierte a un usuario')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('El usuario a advertir')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('razon')
        .setDescription('Razón de la advertencia')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario')
    const reason = interaction.options.getString('razon') || 'No se proporcionó una razón.'

    if (target.bot) {
      return replyWarn(client, interaction, {
        system: 'moderation',
        title: 'Acción inválida',
        lines: ['No puedes advertir a un bot.']
      }, { ephemeral: true })
    }

    try {
      const res = await warnUser({
        guildID: interaction.guild.id,
        targetID: target.id,
        moderatorID: interaction.user.id,
        reason
      })

      await replyOk(client, interaction, {
        system: 'moderation',
        title: 'Warn aplicado',
        thumbnail: target.displayAvatarURL(),
        fields: [
          { name: `${Emojis.member} Usuario`, value: `${target.tag} (${Format.inlineCode(target.id)})`, inline: true },
          { name: `${Emojis.owner} Moderador`, value: `${interaction.user.tag}`, inline: true },
          { name: `${Emojis.stats} Total`, value: Format.inlineCode(res.warnsCount.toString()), inline: true },
          { name: `${Emojis.quote} Razón`, value: Format.quote(reason) }
        ],
        signature: 'Moderación activa'
      })

      // Política: 3 warns => kick (base).
      const policy = await handleWarnThresholdKick({
        client,
        guild: interaction.guild,
        targetID: target.id,
        moderatorID: interaction.user.id,
        warnsCount: res.warnsCount,
        threshold: 3
      })

      if (policy.triggered && !policy.kicked && policy.reason) {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const e = warnEmbed({
          ui,
          system: 'moderation',
          title: 'Auto-kick bloqueado',
          lines: [
            'El usuario llegó a **3** warns, pero no pude kickearlo.',
            `Detalle: ${Format.inlineCode(policy.reason)}`
          ]
        })
        await interaction.followUp({ embeds: [e], ephemeral: true })
      }
      if (policy.kicked) {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const e = okEmbed({
          ui,
          system: 'moderation',
          title: 'Auto-kick aplicado',
          lines: [
            `Usuario: **${target.tag}** (${Format.inlineCode(target.id)})`,
            'Motivo: alcanzó **3** warns.'
          ]
        })
        await interaction.followUp({ embeds: [e], ephemeral: false })
      }

      try {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const dm = warnEmbed({
          ui,
          system: 'moderation',
          title: 'Recibiste un warn',
          lines: [
            `Servidor: **${interaction.guild.name}**`,
            `${Emojis.quote} Razón: ${reason}`,
            `${Emojis.stats} Total: ${res.warnsCount}`
          ],
          signature: 'Cuida tu conducta'
        })
        await target.send({ embeds: [dm] })
      } catch (err) {
        // Ignorar si no se puede enviar DM
      }
    } catch (e) {
      return replyError(client, interaction, {
        system: 'moderation',
        reason: `Error al advertir: ${Format.inlineCode(e.message)}`
      }, { ephemeral: true })
    }
  }
}
