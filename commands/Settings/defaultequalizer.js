const { runMusicDefaultCommand } = require('../../handlers/music-default-command')
module.exports = {
  name: 'defaultequalizer', category: 'Settings', aliases: ['default-equalizer', 'defaulteq', 'default-eq'],
  cooldown: 10, usage: 'defaultequalizer [off|pop|bassboost|metal|treblebass]',
  description: 'Guarda el ecualizador para nuevas conexiones. Sin argumentos alterna Pop/desactivado.',
  memberpermissions: ['Administrator'], type: 'music',
  run: (client, message, args) => runMusicDefaultCommand(client, message, args, 'equalizer'),
}
