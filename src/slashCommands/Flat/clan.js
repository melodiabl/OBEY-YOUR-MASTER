const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { clans } = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed, okEmbed, errorEmbed, warnEmbed } = require('../../core/ui/uiKit')

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

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
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const name = interaction.options.getString('nombre', true)
        const tag = interaction.options.getString('tag')?.trim()
        const clan = await clans.createClan({ client, guildID: interaction.guild.id, ownerID: interaction.user.id, name, tag })

        const e = okEmbed({
          ui,
          system: 'clans',
          title: `${Emojis.clan} Clan creado`,
          lines: [
            `${Emojis.dot} **Nombre:** ${Format.bold(clan.name)}${clan.tag ? ` ${Format.inlineCode('[' + clan.tag + ']')}` : ''}`,
            `${Emojis.dot} **Líder:** <@${clan.ownerID}>`
          ]
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
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
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const u = interaction.options.getUser('usuario') || interaction.user
        const clan = await clans.getClanByUser({ client, guildID: interaction.guild.id, userID: u.id })

        if (!clan) {
          const e = errorEmbed({
            ui,
            system: 'clans',
            title: 'Sin clan',
            reason: `No encontré un clan asociado a ${Format.bold(u.username)}.`,
            hint: `Crea uno con ${Format.inlineCode('/clan create')}.`
          })
          return interaction.reply({ embeds: [e], ephemeral: true })
        }

        const title = `${clan.name}${clan.tag ? ` [${clan.tag}]` : ''}`
        const motto = clan.motto ? `${Emojis.quote} ${Format.italic(clan.motto)}` : `${Emojis.dot} ${Format.italic('Sin lema todavía')}`

        const e = embed({
          ui,
          system: 'clans',
          kind: 'info',
          title: `${Emojis.clan} Clan: ${title}`,
          description: [headerLine(Emojis.clan, 'Resumen'), motto].join('\n'),
          fields: [
            { name: `${Emojis.owner} Líder`, value: `<@${clan.ownerID}>`, inline: true },
            { name: `${Emojis.member} Miembros`, value: Format.inlineCode(String((clan.memberIDs || []).length)), inline: true },
            { name: `${Emojis.bank} Banco`, value: `${Emojis.money} ${Format.bold(money(clan.bank || 0))}`, inline: true }
          ],
          footer: `ID: ${clan._id || 'N/A'}`
        })

        if (clan.bannerUrl) e.setImage(clan.bannerUrl)
        return interaction.reply({ embeds: [e], ephemeral: true })
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
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const target = interaction.options.getUser('usuario', true)
        if (target.bot) {
          const e = errorEmbed({ ui, system: 'clans', title: 'Invitación inválida', reason: 'No puedes invitar bots.' })
          return interaction.reply({ embeds: [e], ephemeral: true })
        }
        await clans.inviteToClan({ client, guildID: interaction.guild.id, inviterID: interaction.user.id, targetID: target.id })
        const e = okEmbed({
          ui,
          system: 'clans',
          title: `${Emojis.clan} Invitación enviada`,
          lines: [
            `${Emojis.dot} Invitado: <@${target.id}>`,
            `${Emojis.dot} Puede aceptar con ${Format.inlineCode('/clan accept')}.`
          ]
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'accept',
      description: 'Acepta una invitación de clan pendiente',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const clan = await clans.acceptInvite({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        const e = okEmbed({
          ui,
          system: 'clans',
          title: `${Emojis.clan} ¡Bienvenido!`,
          lines: [`${Emojis.dot} Te uniste a ${Format.bold(clan.name)}${clan.tag ? ` ${Format.inlineCode('[' + clan.tag + ']')}` : ''}.`]
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'leave',
      description: 'Sales de tu clan',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const clan = await clans.leaveClan({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        const e = warnEmbed({
          ui,
          system: 'clans',
          title: 'Saliste del clan',
          lines: [`${Emojis.dot} Clan: ${Format.bold(clan.name)}`]
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'members',
      description: 'Lista los miembros de tu clan',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const clan = await clans.requireClanByUser({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        const ids = Array.isArray(clan.memberIDs) ? clan.memberIDs : []
        const shown = ids.slice(0, 30)
        const list = shown.length ? shown.map(id => `${Emojis.dot} <@${id}>`).join('\n') : Format.italic('No hay miembros.')

        const e = embed({
          ui,
          system: 'clans',
          kind: 'info',
          title: `${Emojis.member} Miembros — ${clan.name}`,
          description: [
            headerLine(Emojis.clan, `Total: ${ids.length}`),
            list,
            ids.length > 30 ? Format.subtext(`Y ${ids.length - 30} miembros más…`) : null
          ].filter(Boolean).join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    }
  ]
})
