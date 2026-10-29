const { changeGlobalPrefix } = require('../../handlers/global-prefix-command')
module.exports = {
  name: 'changeprefix', category: 'Owner', type: 'bot', memberpermissions: ['Administrator'],
  description: 'Cambia el prefijo global del bot; conserva los prefijos propios de cada servidor.',
  usage: 'changeprefix <NEW PREFIX>',
  run: (client, message, args) => changeGlobalPrefix(client, message, args),
}
