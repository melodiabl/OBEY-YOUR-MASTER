const { runOwnerConsoleNotice } = require('../../handlers/owner-console-command')
module.exports = {
  name: 'eval', category: 'Owner', aliases: ['evaluate'], type: 'bot', usage: 'eval <CODE>',
  description: 'Retired code execution: use concrete commands and maintenance workflows',
  run: (client, message) => runOwnerConsoleNotice(client, message),
}
