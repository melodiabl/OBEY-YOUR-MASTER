const { runMusicDefaultCommand } = require('../../handlers/music-default-command')
module.exports = {
  name: 'defaultvolume', category: 'Settings', aliases: ['default-volume', 'defaultvol', 'default-vol'],
  cooldown: 10, usage: 'defaultvolume <1-150>', description: 'Guarda el volumen para nuevas sesiones de música.',
  memberpermissions: ['Administrator'], type: 'music',
  run: (client, message, args) => runMusicDefaultCommand(client, message, args, 'volume'),
}
