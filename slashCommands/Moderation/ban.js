const {runModeration}=require('../../handlers/moderation/action')
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const Moderation = require('../../database/schemas/ModerationSchema')


module.exports = {
  name: 'ban',
  description: 'Banear a un miembro del servidor',
  memberpermissions: ['BanMembers'],
  options: [
    { User:    { name: 'usuario', description: 'Miembro a banear', required: true } },
    { String:  { name: 'razon',   description: 'Razón del ban',    required: false } },
    { Integer: { name: 'dias',    description: 'Días de mensajes a eliminar (0-7, por defecto 0)', required: false } },
  ],

  run: async (client, interaction) => runModeration(client, interaction, 'ban', {days:Math.min(7,Math.max(0,interaction.options.getInteger('dias')||0))}),
}
