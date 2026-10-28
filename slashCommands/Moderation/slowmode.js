const { runSlashSlowmode } = require('../../src/modules/moderation/discord/slowmode-commands')

module.exports = {
  name: 'slowmode', description: 'Establecer el modo lento en un canal',
  memberpermissions: ['ManageChannels'],
  options: [
    { Integer: { name: 'segundos', description: 'Segundos entre mensajes (0 para desactivar, máx 21600)', required: true } },
    { Channel: { name: 'canal', description: 'Canal objetivo (por defecto: actual)', required: false } },
  ],
  run: (client, interaction) => runSlashSlowmode(client, interaction),
}
