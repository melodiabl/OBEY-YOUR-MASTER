const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'adminrol',
  description: 'Gestionar los roles con acceso a comandos de administración',
  memberpermissions: ['Administrator'],
  options: [
    {
      StringChoices: {
        name: 'accion',
        description: '¿Qué hacer?',
        required: true,
        choices: [
          ['Añadir rol admin',   'add'],
          ['Quitar rol admin',   'remove'],
          ['Ver roles admin',    'list'],
        ],
      },
    },
    { Role: { name: 'rol', description: 'Rol a añadir/quitar', required: false } },
  ],

  run: async (client, interaction) => {
    const ok  = d => new EmbedBuilder().setColor(0x22C55E).setDescription(d)
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)

    const action = interaction.options.getString('accion')
    const role   = interaction.options.getRole('rol')
    const gid    = interaction.guild.id

    let adminroles = client.settings.get(gid, 'adminroles') || []
    if (!Array.isArray(adminroles)) adminroles = []

    if (action === 'list') {
      const valid = adminroles.filter(id => interaction.guild.roles.cache.has(id))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865F2)
          .setTitle('👑 Roles de administración')
          .setDescription(valid.length
            ? valid.map(id => `<@&${id}>`).join('\n')
            : '*(ninguno — solo Administrador nativo tiene acceso)*')
          .setFooter({ text: `${valid.length} roles configurados` })],
        ephemeral: true,
      })
    }

    if (!role)
      return interaction.reply({ embeds: [err('❌ Debes especificar un rol.')], ephemeral: true })

    if (action === 'add') {
      if (adminroles.includes(role.id))
        return interaction.reply({ embeds: [err(`❌ <@&${role.id}> ya es un rol admin.`)], ephemeral: true })
      adminroles.push(role.id)
      client.settings.set(gid, adminroles, 'adminroles')
      return interaction.reply({ embeds: [ok(`✅ <@&${role.id}> puede usar comandos de administración.`)], ephemeral: false })
    }

    if (action === 'remove') {
      if (!adminroles.includes(role.id))
        return interaction.reply({ embeds: [err(`❌ <@&${role.id}> no es un rol admin.`)], ephemeral: true })
      client.settings.set(gid, adminroles.filter(id => id !== role.id), 'adminroles')
      return interaction.reply({ embeds: [ok(`✅ <@&${role.id}> eliminado de los roles admin.`)], ephemeral: true })
    }
  },
}
