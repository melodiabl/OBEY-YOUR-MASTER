module.exports = {
  DESCRIPTION: 'Muestra tu saldo',
  ALIASES: ['bal'],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute (client, message) {
    const userData = await client.db.getUserData(message.author.id)
    message.reply(`Dinero en mano: ${userData.money || 0}\nBanco: ${userData.bank || 0}`)
  }
}
