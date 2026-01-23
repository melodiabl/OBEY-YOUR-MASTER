const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed, replyError, replyOk } = require('../../core/ui/interactionKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Hacer que el bot diga algo (anuncio premium)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option.setName('texto')
        .setDescription('Texto a enviar')
        .setRequired(true)
        .setMaxLength(1800)
    ),

  async execute (client, interaction) {
    const text = String(interaction.options.getString('texto', true) || '').trim()
    if (!text) {
      return replyError(client, interaction, {
        system: 'utility',
        title: 'Mensaje vacío',
        reason: 'No puedo enviar un mensaje sin contenido.'
      }, { ephemeral: true })
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`say_slash:${interaction.user.id}:${Date.now()}`)
        .setStyle(ButtonStyle.Secondary)
        .setLabel(`Enviado por ${interaction.user.tag}`)
        .setDisabled(true)
    )

    const payload = await replyEmbed(client, interaction, {
      system: 'announcements',
      kind: 'info',
      title: `${Emojis.announcements} Anuncio`,
      description: [
        headerLine(Emojis.announcements, 'Mensaje'),
        `${Emojis.quote} ${Format.italic(text)}`
      ].join('\n'),
      signature: 'Mensaje publicado'
    }, { ephemeral: false })

    try {
      await interaction.editReply({ components: [row], allowedMentions: { parse: [], repliedUser: false } })
    } catch (e) {}

    return payload
  }
}

