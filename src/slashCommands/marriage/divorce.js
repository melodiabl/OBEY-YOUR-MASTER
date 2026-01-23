const { SlashCommandBuilder } = require('discord.js')
const { divorce } = require('../../utils/marriageManager')
const Emojis = require('../../utils/emojis')
const { replyError, replyOk } = require('../../core/ui/interactionKit')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('divorce')
    .setDescription('Solicita un divorcio'),
  async execute (client, interaction) {
    const ok = await divorce(interaction.user.id, client.db)

    if (!ok) {
      return replyError(client, interaction, {
        system: 'fun',
        reason: 'No estás casado/a actualmente.'
      }, { ephemeral: true })
    }

    return replyOk(client, interaction, {
      system: 'fun',
      title: 'Matrimonio finalizado',
      lines: [
        'Has decidido terminar tu relación.',
        `${Emojis.dot} ${Format.bold('Estado:')} ahora vuelves a estar soltero/a.`
      ],
      signature: 'Nuevos comienzos'
    }, { ephemeral: true })
  }
}
