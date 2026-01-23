const { SlashCommandBuilder } = require('discord.js')
const { proposeMarriage } = require('../../utils/marriageManager')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed, replyError } = require('../../core/ui/interactionKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('marry')
    .setDescription('Propone matrimonio a otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que quieres proponer matrimonio')
        .setRequired(true)
    ),

  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario', true)

    if (user.bot) {
      return replyError(client, interaction, {
        system: 'fun',
        title: 'Destino inválido',
        reason: 'No puedes casarte con un bot.'
      }, { ephemeral: true })
    }

    const result = await proposeMarriage(interaction.user.id, user.id, client.db)
    if (!result.ok) {
      return replyError(client, interaction, {
        system: 'fun',
        title: 'No se pudo proponer',
        reason: result.message || 'No se pudo proponer matrimonio.'
      }, { ephemeral: true })
    }

    return replyEmbed(client, interaction, {
      system: 'fun',
      kind: 'info',
      title: `${Emojis.reputation} Propuesta de matrimonio`,
      description: [
        headerLine(Emojis.star, '¿Aceptas?'),
        `${Emojis.dot} ${interaction.user} le propuso matrimonio a ${user}.`,
        Format.softDivider(20),
        `${Emojis.confirm} Aceptar: ${Format.inlineCode('/accept')}`,
        `${Emojis.cancel} Rechazar: ${Format.inlineCode('/reject')}`,
        '',
        `${Emojis.loading} ${Format.italic('Esperando respuesta…')}`
      ].join('\n'),
      signature: '𓆩♡𓆪 Romance system 𓆩♡𓆪'
    }, { ephemeral: false })
  }
}

