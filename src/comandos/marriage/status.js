module.exports = {
  DESCRIPTION: 'Muestra tu estado de matrimonio',
  ALIASES: ['marriage', 'marryinfo'],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute (client, message) {
    const userData = await client.db.getUserData(message.author.id)
    if (!userData.partner) return message.reply('No estás casado.')
    message.reply(`Estás casado con <@${userData.partner}>.`)
  }
}
