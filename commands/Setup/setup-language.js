const { openLanguageSetup } = require('../../handlers/setup-language')

module.exports = {
  name: 'setup-language',
  category: 'Setup',
  aliases: ['setuplanguage', 'setup-caps', 'setupcaps', 'language-setup', 'languagesetup'],
  cooldown: 5,
  usage: 'setup-language',
  description: 'Consulta y cambia el idioma del bot en este servidor',
  memberpermissions: ['Administrador'],
  type: 'info',
  run: (client, message) => openLanguageSetup(client, message),
}
