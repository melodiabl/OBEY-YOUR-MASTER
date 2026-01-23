const { SlashCommandBuilder } = require('discord.js')
const { buyProtect } = require('../../systems').economy
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError } = require('../../core/ui/interactionKit')

module.exports = {
  MODULE: 'economy',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('protect-buy')
    .setDescription('Compra proteccion anti-robos')
    .addIntegerOption(o =>
      o
        .setName('horas')
        .setDescription('Duracion (1-168). Default: 24')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(168)
    ),

  async execute (client, interaction) {
    const hours = interaction.options.getInteger('horas') || 24
    const price = Math.ceil(500 * (hours / 24))
    try {
      const res = await buyProtect({ client, guildID: interaction.guild.id, userID: interaction.user.id, hours, price })
      return replyOk(client, interaction, {
        system: 'economy',
        title: `${Emojis.success} Protección activa`,
        lines: [
          `${Emojis.dot} Hasta: <t:${Math.floor(res.until / 1000)}:R>`,
          `${Emojis.dot} Costo: ${Emojis.money} ${Format.inlineCode(price)}`,
          `${Emojis.dot} Duración: ${Format.inlineCode(hours + 'h')}`
        ],
        signature: 'Anti-robos listo'
      }, { ephemeral: true })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'No pude activar protección',
        reason: e?.message || String(e || 'Error desconocido.')
      }, { ephemeral: true })
    }
  }
}
