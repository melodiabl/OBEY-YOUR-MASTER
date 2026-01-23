const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, embed, headerLine } = require('../../core/ui/uiKit')
const { replyError } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Envía un mensaje como el bot (con confirmación premium)',
  PERMISSIONS: ['ManageMessages'],
  BOT_PERMISSIONS: ['ManageMessages'],
  async execute (client, message, args) {
    const content = String(args.join(' ') || '').trim()
    if (!content) {
      return replyError(client, message, {
        system: 'utility',
        title: 'Mensaje vacío',
        reason: 'No puedo enviar un mensaje sin contenido.',
        hint: `Ejemplo: ${Format.inlineCode('say Hola comunidad')}`
      })
    }

    const ui = await getGuildUiConfig(client, message.guild.id)

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`say:${message.author.id}:${Date.now()}`)
        .setStyle(ButtonStyle.Secondary)
        .setLabel(`Enviado por ${message.author.tag}`)
        .setDisabled(true)
    )

    const msg = embed({
      ui,
      system: 'announcements',
      kind: 'info',
      title: `${Emojis.announcements} Anuncio`,
      description: [
        headerLine(Emojis.announcements, 'Mensaje'),
        `${Emojis.quote} ${Format.italic(content.length > 1800 ? content.slice(0, 1799) + '…' : content)}`
      ].join('\n'),
      signature: 'Mensaje publicado'
    })

    await message.channel.send({
      embeds: [msg],
      components: [row],
      allowedMentions: { parse: [], repliedUser: false }
    }).catch(() => {})

    const confirm = embed({
      ui,
      system: 'announcements',
      kind: 'success',
      title: `${Emojis.success} Enviado`,
      description: [
        headerLine(Emojis.announcements, 'Confirmación'),
        `${Emojis.dot} Publicado por: ${message.author}`,
        `${Emojis.dot} Canal: ${message.channel}`
      ].join('\n')
    })

    const confirmMsg = await message.channel.send({ embeds: [confirm], allowedMentions: { parse: ['users'], repliedUser: false } }).catch(() => null)
    if (confirmMsg) setTimeout(() => confirmMsg.delete().catch(() => {}), 4500)

    await message.delete().catch(() => {})
  }
}
