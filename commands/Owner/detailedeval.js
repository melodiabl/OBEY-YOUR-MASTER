const { runOwnerConsoleNotice } = require('../../handlers/owner-console-command')
module.exports = {
  name: 'detailedeval', category: 'Owner', aliases: ['detailedevaluate', 'detailevaluate', 'detaileval'], type: 'bot', usage: 'detailedeval <CODE>',
  description: 'Retired code execution: use concrete commands and maintenance workflows',
  run: (client, message) => runOwnerConsoleNotice(client, message),
}
