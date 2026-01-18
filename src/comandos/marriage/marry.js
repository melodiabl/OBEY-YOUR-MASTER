const marriageManager = require('../../utils/marriageManager')

module.exports = {
  DESCRIPTION: 'Propone matrimonio a otro usuario',
  ALIASES: [],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute (client, message, args, prefix) {
    const target = message.mentions.users.first()
    if (!target) return message.reply('Debes mencionar a alguien para casarte.')
    if (target.id === message.author.id) return message.reply('No puedes casarte contigo mismo.')
    const proposerData = await client.db.getUserData(message.author.id)
    const targetData = await client.db.getUserData(target.id)
    if (proposerData.partner) return message.reply('Ya estás casado.')
    if (targetData.partner) return message.reply('Esa persona ya está casada.')
    if (marriageManager.hasPending(target.id)) return message.reply('Esa persona ya tiene una propuesta pendiente.')
    marriageManager.propose(message.author.id, target.id)
    message.reply(`${target}, ¿aceptas casarte con ${message.author}? Escribe \`${prefix}accept\` para aceptar o \`${prefix}reject\` para rechazar.`)
  }
}
