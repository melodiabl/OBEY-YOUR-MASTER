const {runModeration}=require('../../handlers/moderation/action')
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const Moderation = require('../../database/schemas/ModerationSchema')

const DURATIONS = {
  '60s':    60_000,
  '5m':     5  * 60_000,
  '10m':    10 * 60_000,
  '30m':    30 * 60_000,
  '1h':     60 * 60_000,
  '6h':     6  * 60 * 60_000,
  '12h':    12 * 60 * 60_000,
  '1d':     24 * 60 * 60_000,
  '3d':     3  * 24 * 60 * 60_000,
  '7d':     7  * 24 * 60 * 60_000,
}


module.exports = {
  name: 'timeout',
  description: 'Silenciar temporalmente a un miembro',
  memberpermissions: ['ModerateMembers'],
  options: [
    { User: { name: 'usuario', description: 'Miembro a silenciar', required: true } },
    {
      StringChoices: {
        name: 'duracion',
        description: 'Duración del timeout',
        required: true,
        choices: [
          ['1 minuto',   '60s'],
          ['5 minutos',  '5m'],
          ['10 minutos', '10m'],
          ['30 minutos', '30m'],
          ['1 hora',     '1h'],
          ['6 horas',    '6h'],
          ['12 horas',   '12h'],
          ['1 día',      '1d'],
          ['3 días',     '3d'],
          ['7 días',     '7d'],
        ],
      },
    },
    { String: { name: 'razon', description: 'Razón', required: false } },
  ],

  run: async (client, interaction) => runModeration(client, interaction, 'timeout', {duration:DURATIONS[interaction.options.getString('duracion')]}),
}
