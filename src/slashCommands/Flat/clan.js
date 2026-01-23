const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { clans } = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { EmbedBuilder } = require('discord.js')

module.exports = createSystemSlashCommand({
  name: 'clan',
  description: 'Sistema de clanes',
  moduleKey: 'clans',
  subcommands: [
    {
      name: 'create',
      description: 'Crea un clan',
      options: [
        {
          apply: (sub) => sub.addStringOption(o => o.setName('nombre').setDescription('Nombre del clan').setRequired(true).setMinLength(3).setMaxLength(30))
        },
        {
          apply: (sub) => sub.addStringOption(o => o.setName('tag').setDescription('Tag (opcional)').setRequired(false).setMinLength(2).setMaxLength(6))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const name = interaction.options.getString('nombre', true)
        const tag = interaction.options.getString('tag')
        const clan = await clans.createClan({ client, guildID: interaction.guild.id, ownerID: interaction.user.id, name, tag })
        return interaction.reply({ content: `✅ Clan creado: **${clan.name}**${clan.tag ? ` [${clan.tag}]` : ''}`, ephemeral: true })
      }
    },
    {
      name: 'info',
      description: 'Muestra info de un clan',
      options: [
        {
          apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario para ver su clan (opcional)').setRequired(false))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const u = interaction.options.getUser('usuario') || interaction.user
        const clan = await clans.getClanByUser({ client, guildID: interaction.guild.id, userID: u.id })

        if (!clan) {
          return interaction.reply({
            content: `${Emojis.error} No se encontró un clan asociado a ${Format.bold(u.username)}.`,
            ephemeral: true
          })
        }

        const embed = new EmbedBuilder()
          .setTitle(`${Emojis.clan} Clan: ${clan.name}${clan.tag ? ` [${clan.tag}]` : ''}`)
          .setColor('Gold')
          .setDescription(clan.motto ? Format.quote(clan.motto) : Format.italic('Sin lema del clan'))
          .addFields(
            { name: `${Emojis.owner} Líder`, value: `<@${clan.ownerID}>`, inline: true },
            { name: `${Emojis.member} Miembros`, value: Format.inlineCode((clan.memberIDs || []).length.toString()), inline: true },
            { name: `${Emojis.bank} Banco`, value: `${Emojis.money} ${Format.bold((clan.bank || 0).toLocaleString())}`, inline: true }
          )
          .setFooter({ text: `ID: ${clan._id || 'Desconocido'}` })
          .setTimestamp()

        if (clan.bannerUrl) embed.setImage(clan.bannerUrl)
        return interaction.reply({ embeds: [embed] })
      }
    },
    {
      name: 'invite',
      description: 'Invita a un usuario a tu clan (solo dueño)',
      options: [
        {
          apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario a invitar').setRequired(true))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('usuario', true)
        if (target.bot) return interaction.reply({ content: 'No puedes invitar bots.', ephemeral: true })
        await clans.inviteToClan({ client, guildID: interaction.guild.id, inviterID: interaction.user.id, targetID: target.id })
        return interaction.reply({ content: `✅ Invitación enviada a <@${target.id}>.`, ephemeral: true })
      }
    },
    {
      name: 'accept',
      description: 'Acepta una invitación de clan pendiente',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const clan = await clans.acceptInvite({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: `✅ Te uniste a **${clan.name}**${clan.tag ? ` [${clan.tag}]` : ''}.`, ephemeral: true })
      }
    },
    {
      name: 'leave',
      description: 'Sales de tu clan',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const clan = await clans.leaveClan({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: `✅ Saliste del clan **${clan.name}**.`, ephemeral: true })
      }
    },
    {
      name: 'members',
      description: 'Lista los miembros de tu clan',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const clan = await clans.requireClanByUser({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        const ids = Array.isArray(clan.memberIDs) ? clan.memberIDs : []

        const embed = new EmbedBuilder()
          .setTitle(`${Emojis.member} Miembros de: ${clan.name}`)
          .setColor('Blue')
          .setDescription(Format.subtext(`Total de miembros: ${Format.bold(ids.length.toString())}`))
          .setTimestamp()

        const memberList = ids.slice(0, 30).map(id => `${Emojis.dot} <@${id}>`).join('\n')
        embed.addFields({
          name: `Lista de Miembros${ids.length > 30 ? ' (Primeros 30)' : ''}`,
          value: memberList || 'No hay miembros.'
        })

        if (ids.length > 30) embed.setFooter({ text: `Y ${ids.length - 30} miembros más...` })
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    }
  ]
})
