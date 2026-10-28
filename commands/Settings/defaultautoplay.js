const { runMusicDefaultCommand } = require('../../handlers/music-default-command')
module.exports = {
  name: 'defaultautoplay', category: 'Settings', aliases: ['default-autoplay', 'defaultap', 'default-ap'],
  cooldown: 10, usage: 'defaultautoplay', description: 'Alterna autoplay para nuevas sesiones de música.',
  memberpermissions: ['Administrator'], type: 'music',
  run: (client, message, args) => runMusicDefaultCommand(client, message, args, 'autoplay'),
}
