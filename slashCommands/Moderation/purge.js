const obeyUi = require("../../handlers/assets/system")
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js')
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
    const err = d => ({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))], ephemeral: true })
    const ok  = d => ({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(obeyUi.limit(d, 4096))], ephemeral: true })

    const amount = interaction.options.getInteger('cantidad')
    const filter = interaction.options.getString('filtro') || 'all'
    const targetUser = interaction.options.getUser('usuario')

    if (amount < 1 || amount > 99)
      return interaction.reply(err(obeyUi.owned('❌ La cantidad debe estar entre 1 y 99.')))

    if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages))
      return interaction.reply(err(obeyUi.owned('❌ No tengo permisos para eliminar mensajes aquí.')))

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
        return interaction.editReply(err(obeyUi.owned('❌ No se encontraron mensajes que coincidan.')))

      const deleted = await interaction.channel.bulkDelete(slice, true)
      await interaction.editReply(ok(`${obeyUi.markup("icon.delete")} **${deleted.size}** mensaje(s) eliminado(s).`))
    } catch (e) {
      await interaction.editReply(err(`${obeyUi.markup("icon.error")} Error: ${e.message}`))
    }
  },
}
