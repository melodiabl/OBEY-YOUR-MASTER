const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const { warnUser, applyWarnPolicy } = require('../../systems').moderation
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
      const guildData = await client.db.getGuildData(interaction.guild.id).catch(() => null)
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
          { name: `${Emojis.stats} Total`, value: Format.inlineCode(String(res.warnsCount)), inline: true },
          { name: `${Emojis.quote} Razón`, value: Format.quote(reason) }
        ],
        signature: 'Moderación activa'
      })

      // Política progresiva por servidor (warnPolicy). Default: 3 => kick.
      try {
        const policy = await applyWarnPolicy({
          client,
          guild: interaction.guild,
          guildData,
          targetID: target.id,
          moderatorID: interaction.user.id,
          warnsCount: res.warnsCount
        })

        if (policy.triggered && !policy.ok) {
          const ui = await getGuildUiConfig(client, interaction.guild.id)
          const e = warnEmbed({
            ui,
            system: 'moderation',
            title: 'Auto-moderación bloqueada',
            lines: [
              `Se intentó aplicar: ${Format.inlineCode(String(policy.action || 'unknown'))} (warn #${policy.threshold || res.warnsCount})`,
              policy.reason ? `Detalle: ${Format.inlineCode(policy.reason)}` : null
            ].filter(Boolean)
          })
          await interaction.followUp({ embeds: [e], ephemeral: true }).catch(() => {})
        }

        if (policy.triggered && policy.ok) {
          const ui = await getGuildUiConfig(client, interaction.guild.id)
          const e = okEmbed({
            ui,
            system: 'moderation',
            title: 'Auto-moderación aplicada',
            lines: [
              `Usuario: **${target.tag}** (${Format.inlineCode(target.id)})`,
              `Acción: ${Format.inlineCode(String(policy.action))} (warn #${policy.threshold})`,
              policy.durationMs ? `Duración: ${Format.inlineCode(Math.ceil(policy.durationMs / 1000) + 's')}` : null
            ].filter(Boolean)
          })
          await interaction.followUp({ embeds: [e], ephemeral: false }).catch(() => {})
        }
      } catch (e) {}

      // DM informativo (best-effort)
      try {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const dm = warnEmbed({
          ui,
          system: 'moderation',
          title: 'Recibiste un warn',
          lines: [
            `Servidor: **${interaction.guild.name}**`,
            `${Emojis.quote} Razón: ${reason}`,
            `${Emojis.stats} Total: ${res.warnsCount}`,
            `${Emojis.dot} Si quieres apelar: ${Format.inlineCode('/appeal create')}`
          ],
          signature: 'Cuida tu conducta'
        })
        await target.send({ embeds: [dm] })
      } catch (err) {}
    } catch (e) {
      return replyError(client, interaction, {
        system: 'moderation',
        reason: `Error al advertir: ${Format.inlineCode(e?.message || String(e))}`
      }, { ephemeral: true })
    }
  }
}
