const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { createClan, getClanByUser, inviteToClan, acceptInvite, leaveClan, clanDeposit } = require('../../systems/clans/clanService')

module.exports = createSystemSlashCommand({
  name: 'clans',
  description: 'Sistema de clanes/gremios (base)',
  moduleKey: 'clans',
  defaultCooldownMs: 3_000,
  subcommands: [
    {
      name: 'create',
      description: 'Crea un clan',
      options: [
        {
          apply: (sc) =>
            sc
              .addStringOption(o =>
                o.setName('nombre').setDescription('Nombre del clan').setRequired(true).setMinLength(3).setMaxLength(24)
              )
              .addStringOption(o =>
                o.setName('tag').setDescription('Tag corto (opcional)').setRequired(false).setMinLength(2).setMaxLength(6)
              )
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const name = interaction.options.getString('nombre', true)
        const tag = interaction.options.getString('tag')
        const clan = await createClan({ client, guildID: interaction.guild.id, ownerID: interaction.user.id, name, tag })
        return interaction.reply({ content: `✅ Clan creado: **${clan.name}**${clan.tag ? ` [${clan.tag}]` : ''}`, ephemeral: true })
      }
    },
    {
      name: 'info',
      description: 'Muestra información del clan (tuyo o de un usuario)',
      options: [
        {
          apply: (sc) =>
            sc.addUserOption(o =>
              o.setName('usuario').setDescription('Usuario (opcional)').setRequired(false)
            )
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario') || interaction.user
        const clan = await getClanByUser({ client, guildID: interaction.guild.id, userID: user.id })
        if (!clan) return interaction.reply({ content: 'No estás en un clan (o ese usuario no tiene clan).', ephemeral: true })

        const embed = new EmbedBuilder()
          .setTitle(`🏰 ${clan.name}${clan.tag ? ` [${clan.tag}]` : ''}`)
          .setColor('Blurple')
          .addFields(
            { name: 'Dueño', value: `<@${clan.ownerID}>`, inline: true },
            { name: 'Miembros', value: String((clan.memberIDs || []).length), inline: true },
            { name: 'Banco', value: String(clan.bank || 0), inline: true }
          )
          .setTimestamp()

        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'invite',
      description: 'Invita a un usuario a tu clan (solo dueño, base)',
      options: [
        {
          apply: (sc) =>
            sc.addUserOption(o =>
              o.setName('usuario').setDescription('Usuario a invitar').setRequired(true)
            )
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('usuario', true)
        if (target.bot) return interaction.reply({ content: 'No puedes invitar bots.', ephemeral: true })
        const clan = await inviteToClan({ client, guildID: interaction.guild.id, inviterID: interaction.user.id, targetID: target.id })
        try {
          await target.send(`Te invitaron al clan **${clan.name}** en **${interaction.guild.name}**.\nUsa \`/clans accept\` en el servidor para unirte.`)
        } catch (e) {}
        return interaction.reply({ content: `✅ Invitación enviada a <@${target.id}>.`, ephemeral: true })
      }
    },
    {
      name: 'accept',
      description: 'Acepta una invitación pendiente',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const clan = await acceptInvite({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: `✅ Te uniste al clan **${clan.name}**.`, ephemeral: true })
      }
    },
    {
      name: 'leave',
      description: 'Sal de tu clan (base)',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        await leaveClan({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: '✅ Saliste del clan.', ephemeral: true })
      }
    },
    {
      name: 'deposit',
      description: 'Deposita dinero al banco del clan',
      options: [
        {
          apply: (sc) =>
            sc.addIntegerOption(o =>
              o.setName('cantidad').setDescription('Cantidad a depositar').setRequired(true).setMinValue(1)
            )
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const amount = interaction.options.getInteger('cantidad', true)
        const clan = await clanDeposit({ client, guildID: interaction.guild.id, userID: interaction.user.id, amount })
        return interaction.reply({ content: `✅ Depositaste **${amount}**. Banco del clan: **${clan.bank}**.`, ephemeral: true })
      }
    }
  ]
})

