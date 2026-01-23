const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed } = require('../../core/ui/interactionKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Muestra el avatar de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario cuyo avatar quieres ver')
        .setRequired(false)
    ),

  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user
    const url = user.displayAvatarURL({ size: 1024 })
    return replyEmbed(client, interaction, {
      system: 'utility',
      kind: 'info',
      title: `${Emojis.human} Avatar`,
      description: [
        headerLine(Emojis.utility, user.tag),
        `${Emojis.dot} **ID:** ${Format.inlineCode(user.id)}`
      ].join('\n'),
      image: url
    }, { ephemeral: false })
  }
}

