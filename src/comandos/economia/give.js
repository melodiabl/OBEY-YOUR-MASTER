module.exports = {
  DESCRIPTION: 'Envía monedas a otro usuario',
  ALIASES: ['enviar', 'pay'],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute (client, message, args) {
    const target = message.mentions.users.first()
    const amount = parseInt(args[1], 10)
    if (!target || !amount || amount <= 0) {
      return message.reply('Uso: !give @usuario cantidad')
    }
    const senderData = await client.db.getUserData(message.author.id)
    if ((senderData.money || 0) < amount) {
      return message.reply('No tienes suficiente dinero.')
    }
    const receiverData = await client.db.getUserData(target.id)
    senderData.money -= amount
    receiverData.money = (receiverData.money || 0) + amount
    await senderData.save()
    await receiverData.save()
    message.reply(`Has enviado ${amount} monedas a ${target}.`)
  }
}
