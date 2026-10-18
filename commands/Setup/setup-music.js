const { openMusicSetup } = require('../../handlers/setup-music-resources')
const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: "setup-music",
  category: "Setup",
  aliases: ["setupmusic"],
  cooldown: 10,
  usage: "setup-music #Canal",
  description: "Configuración de un Canal de Solicitud de Música",
  memberpermissions: ['Administrador'],
  type: "fun",
  run: (client, message) => openMusicSetup(client, message, "", PermissionFlagsBits.Administrator),
}
