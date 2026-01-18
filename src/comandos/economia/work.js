module.exports = {
  DESCRIPTION: 'Trabaja una vez cada hora para ganar monedas',
  ALIASES: [],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute (client, message) {
    const userData = await client.db.getUserData(message.author.id)
    const now = Date.now()
    if (userData.workCooldown && userData.workCooldown > now) {
      const diff = userData.workCooldown - now
      const minutes = Math.ceil(diff / 60000)
      return message.reply(`Debes esperar ${minutes} minutos antes de volver a trabajar.`)
    }
    const amount = Math.floor(Math.random() * 51) + 50
    userData.money = (userData.money || 0) + amount
    userData.workCooldown = now + 60 * 60 * 1000
    await userData.save()
    message.reply(`¡Has trabajado y ganado ${amount} monedas!`)
  }
}
