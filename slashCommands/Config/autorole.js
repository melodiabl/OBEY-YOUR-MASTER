const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'autorole',
  description: 'Añadir o quitar un rol que se da automáticamente al entrar',
  memberpermissions: ['ManageGuild'],
  options: [
    {
      StringChoices: {
        name: 'accion',
        description: '¿Qué hacer?',
        required: true,
        choices: [
          ['Añadir rol',    'add'],
          ['Quitar rol',    'remove'],
          ['Ver lista',     'list'],
          ['Limpiar todos', 'clear'],
        ],
      },
    },
    { Role: { name: 'rol', description: 'Rol a añadir/quitar del autorole', required: false } },
  ],

  run: async (client, interaction) => {
    const ok  = d => new EmbedBuilder().setColor(0x22C55E).setDescription(d)
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)

    const action = interaction.options.getString('accion')
    const role   = interaction.options.getRole('rol')
    const gid    = interaction.guild.id

    let roles = client.settings.get(gid, 'welcome.roles') || []
    if (!Array.isArray(roles)) roles = []

    if (action === 'list') {
      const valid = roles.filter(id => interaction.guild.roles.cache.has(id))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865F2)
          .setTitle('🎭 Autoroles configurados')
          .setDescription(valid.length
            ? valid.map(id => `<@&${id}>`).join('\n')
            : '*(ninguno configurado)*')
          .setFooter({ text: `${valid.length} roles` })],
        ephemeral: true,
      })
    }

    if (action === 'clear') {
      client.settings.set(gid, [], 'welcome.roles')
      return interaction.reply({ embeds: [ok('🧹 Todos los autoroles eliminados.')], ephemeral: true })
    }

    if (!role)
      return interaction.reply({ embeds: [err('❌ Debes especificar un rol.')], ephemeral: true })

    if (action === 'add') {
      if (roles.includes(role.id))
        return interaction.reply({ embeds: [err(`❌ <@&${role.id}> ya es un autorole.`)], ephemeral: true })
      if (!interaction.guild.members.me.roles.highest.comparePositionTo(role))
        return interaction.reply({ embeds: [err('❌ No puedo asignar ese rol, está por encima del mío.')], ephemeral: true })
      roles.push(role.id)
      client.settings.set(gid, roles, 'welcome.roles')
      return interaction.reply({ embeds: [ok(`✅ <@&${role.id}> añadido como autorole.\nSe dará a todos los nuevos miembros al entrar.`)], ephemeral: false })
    }

    if (action === 'remove') {
      if (!roles.includes(role.id))
        return interaction.reply({ embeds: [err(`❌ <@&${role.id}> no es un autorole.`)], ephemeral: true })
      client.settings.set(gid, roles.filter(id => id !== role.id), 'welcome.roles')
      return interaction.reply({ embeds: [ok(`✅ <@&${role.id}> eliminado del autorole.`)], ephemeral: true })
    }
  },
}
