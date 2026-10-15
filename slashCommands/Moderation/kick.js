const {runModeration}=require('../../handlers/moderation/action')
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const Moderation = require('../../database/schemas/ModerationSchema')


module.exports = {
  name: 'kick',
  description: 'Expulsar a un miembro del servidor',
  memberpermissions: ['KickMembers'],
  options: [
    { User:   { name: 'usuario', description: 'Miembro a expulsar', required: true } },
    { String: { name: 'razon',   description: 'Razón',              required: false } },
  ],

  run: async (client, interaction) => runModeration(client, interaction, 'kick', {}),
}
