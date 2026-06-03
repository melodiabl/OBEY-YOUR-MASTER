const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'purge',
  description: 'Eliminar mensajes en masa del canal actual',
  memberpermissions: ['ManageMessages'],
  options: [
    { Integer: { name: 'cantidad', description: 'Cantidad de mensajes a eliminar (1-99)', required: true } },
    {
      StringChoices: {
        name: 'filtro',
        description: 'Filtrar tipo de mensajes',
        required: false,
        choices: [
          ['Todos', 'all'],
          ['Solo bots', 'bots'],
          ['Solo links', 'links'],
          ['Solo attachments', 'attachments'],
        ],
      },
    },
    { User: { name: 'usuario', description: 'Solo mensajes de este usuario', required: false } },
  ],
  run: async (client, interaction) => {
    const amount = interaction.options.getInteger('cantidad')
    const filter = interaction.options.getString('filtro') || 'all'
    const targetUser = interaction.options.getUser('usuario')

    if (amount < 1 || amount > 99)
      return interaction.reply({ content: '❌ La cantidad debe estar entre 1 y 99.', ephemeral: true })

    if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages))
      return interaction.reply({ content: '❌ No tengo permisos para eliminar mensajes aquí.', ephemeral: true })

    await interaction.deferReply({ ephemeral: true })

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 })
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000

      let toDelete = messages.filter(m => m.createdTimestamp > twoWeeksAgo)

      if (targetUser) {
        toDelete = toDelete.filter(m => m.author.id === targetUser.id)
      } else {
        switch (filter) {
          case 'bots': toDelete = toDelete.filter(m => m.author.bot); break
          case 'links': toDelete = toDelete.filter(m => /https?:\/\/\S+/i.test(m.content)); break
          case 'attachments': toDelete = toDelete.filter(m => m.attachments.size > 0); break
        }
      }

      const slice = [...toDelete.values()].slice(0, amount)
      if (!slice.length)
        return interaction.editReply('❌ No se encontraron mensajes que coincidan.')

      const deleted = await interaction.channel.bulkDelete(slice, true)
      await interaction.editReply(`✅ ${deleted.size} mensaje(s) eliminado(s).`)
    } catch (e) {
      await interaction.editReply(`❌ Error: ${e.message}`)
    }
  },
}
