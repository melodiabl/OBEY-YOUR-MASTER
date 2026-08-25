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

async function nextCaseId(guildId) {
  const last = await Moderation.findOne({ guildId }).sort({ caseId: -1 }).select('caseId').lean()
  return (last?.caseId || 0) + 1
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

  run: async (client, interaction) => {
    const err = d => ({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(d)], ephemeral: true })

    const target   = interaction.options.getUser('usuario')
    const durKey   = interaction.options.getString('duracion')
    const reason   = interaction.options.getString('razon') || 'Sin razón'
    const durMs    = DURATIONS[durKey]

    if (target.id === interaction.user.id) return interaction.reply(err('❌ No puedes silenciarte a ti mismo.'))
    if (target.id === client.user.id)      return interaction.reply(err('❌ No me puedo silenciar a mí mismo.'))

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers))
      return interaction.reply(err('❌ No tengo el permiso de **Moderar Miembros**.'))

    const member = interaction.guild.members.cache.get(target.id)
    if (!member) return interaction.reply(err('❌ Ese usuario no está en el servidor.'))
    if (!member.moderatable) return interaction.reply(err('❌ No puedo silenciar a ese miembro.'))
    if (interaction.guild.ownerId !== interaction.user.id &&
        member.roles.highest.position >= interaction.member.roles.highest.position)
      return interaction.reply(err('❌ No puedes silenciar a alguien con un rol igual o superior al tuyo.'))

    await interaction.deferReply()

    try {
      await member.timeout(durMs, reason)

      const caseId = await nextCaseId(interaction.guild.id)
      await Moderation.create({
        guildId:     interaction.guild.id,
        userId:      target.id,
        action:      'timeout',
        reason,
        moderatorId: interaction.user.id,
        duration:    durMs,
        caseId,
        active:      true,
      })

      await target.send({
        embeds: [new EmbedBuilder().setColor(0x8B5CF6)
          .setTitle(`⏱️ Has sido silenciado en **${interaction.guild.name}**`)
          .addFields(
            { name: '⏱️ Duración', value: durKey,              inline: true },
            { name: '📋 Razón',    value: reason,              inline: true },
            { name: '👮 Por',      value: interaction.user.tag, inline: true },
          )],
      }).catch(() => {})

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0x8B5CF6)
          .setTitle('⏱️ Timeout aplicado')
          .setThumbnail(target.displayAvatarURL())
          .addFields(
            { name: '👤 Usuario',  value: `${target} (${target.id})`, inline: true },
            { name: '👮 Mod',      value: `${interaction.user}`,       inline: true },
            { name: '⏱️ Duración', value: durKey,                      inline: true },
            { name: '📋 Razón',    value: reason,                      inline: false },
            { name: '🗂️ Caso',    value: `#${caseId}`,                 inline: true },
          )
          .setTimestamp()],
      })
    } catch (e) {
      await interaction.editReply(err(`❌ Error: ${e.message}`))
    }
  },
}
