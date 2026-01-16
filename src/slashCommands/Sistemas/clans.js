const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const {
  createClan,
  getClanByUser,
  inviteToClan,
  acceptInvite,
  declineInvite,
  leaveClan,
  disbandClan,
  kickMember,
  setMotto,
  setBanner,
  clanDeposit,
  clanWithdraw,
  topClans
} = require('../../systems/clans/clanService')

module.exports = createSystemSlashCommand({
  name: 'clans',
  description: 'Sistema de clanes/gremios (base escalable)',
  moduleKey: 'clans',
  defaultCooldownMs: 2_500,
  subcommands: [
    {
      name: 'create',
      description: 'Crea un clan',
      options: [
        {
          apply: (sc) =>
            sc
              .addStringOption(o => o.setName('nombre').setDescription('Nombre del clan').setRequired(true).setMinLength(3).setMaxLength(24))
              .addStringOption(o => o.setName('tag').setDescription('Tag corto (opcional)').setRequired(false).setMinLength(2).setMaxLength(6))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const name = interaction.options.getString('nombre', true)
        const tag = interaction.options.getString('tag')
        const clan = await createClan({ client, guildID: interaction.guild.id, ownerID: interaction.user.id, name, tag })
        return interaction.reply({ content: `ƒo. Clan creado: **${clan.name}**${clan.tag ? ` [${clan.tag}]` : ''}`, ephemeral: true })
      }
    },
    {
      name: 'info',
      description: 'Info del clan (tuyo o de un usuario)',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario (opcional)').setRequired(false)) }],
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
            { name: 'Banco', value: String(clan.bank || 0), inline: true },
            { name: 'Motto', value: clan.motto || '*Sin motto*' }
          )
        if (clan.bannerUrl) embed.setImage(clan.bannerUrl)
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'members',
      description: 'Lista miembros del clan',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const clan = await getClanByUser({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        if (!clan) return interaction.reply({ content: 'No estás en un clan.', ephemeral: true })
        const members = (clan.memberIDs || []).map(id => `<@${id}>`)
        const embed = new EmbedBuilder()
          .setTitle(`Miembros • ${clan.name}`)
          .setColor('Blurple')
          .setDescription(members.join('\n') || '*Sin miembros*')
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'invite',
      description: 'Invita a un usuario (solo dueño)',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario a invitar').setRequired(true)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('usuario', true)
        if (target.bot) return interaction.reply({ content: 'No puedes invitar bots.', ephemeral: true })
        const clan = await inviteToClan({ client, guildID: interaction.guild.id, inviterID: interaction.user.id, targetID: target.id })
        try {
          await target.send(`Te invitaron al clan **${clan.name}** en **${interaction.guild.name}**.\nUsa \`/clans accept\` en el servidor para unirte.`)
        } catch (_) {}
        return interaction.reply({ content: `ƒo. Invitación enviada a <@${target.id}>.`, ephemeral: true })
      }
    },
    {
      name: 'accept',
      description: 'Acepta invitación',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const clan = await acceptInvite({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: `ƒo. Te uniste al clan **${clan.name}**.`, ephemeral: true })
      }
    },
    {
      name: 'decline',
      description: 'Rechaza invitación',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        await declineInvite({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: 'ƒo. Invitación rechazada.', ephemeral: true })
      }
    },
    {
      name: 'leave',
      description: 'Sale del clan',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        await leaveClan({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: 'ƒo. Saliste del clan.', ephemeral: true })
      }
    },
    {
      name: 'kick',
      description: 'Expulsa un miembro (solo dueño)',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Miembro').setRequired(true)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario', true)
        await kickMember({ client, guildID: interaction.guild.id, ownerID: interaction.user.id, memberID: user.id })
        return interaction.reply({ content: `ƒo. <@${user.id}> expulsado del clan.`, ephemeral: true })
      }
    },
    {
      name: 'motto',
      description: 'Define el motto del clan (solo dueño)',
      options: [{ apply: (sc) => sc.addStringOption(o => o.setName('texto').setDescription('Motto (vacío para borrar)').setRequired(false).setMaxLength(120)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const text = interaction.options.getString('texto') || ''
        const clan = await setMotto({ client, guildID: interaction.guild.id, userID: interaction.user.id, motto: text })
        return interaction.reply({ content: `ƒo. Motto actualizado: ${clan.motto || '*Sin motto*'}`, ephemeral: true })
      }
    },
    {
      name: 'banner',
      description: 'Define banner URL (solo dueño)',
      options: [{ apply: (sc) => sc.addStringOption(o => o.setName('url').setDescription('URL http/https (vacío para borrar)').setRequired(false).setMaxLength(400)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const url = interaction.options.getString('url') || ''
        const clan = await setBanner({ client, guildID: interaction.guild.id, userID: interaction.user.id, url })
        return interaction.reply({ content: `ƒo. Banner actualizado: ${clan.bannerUrl ? clan.bannerUrl : '*Sin banner*'}`, ephemeral: true })
      }
    },
    {
      name: 'deposit',
      description: 'Deposita dinero al banco del clan',
      options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true).setMinValue(1)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const amount = interaction.options.getInteger('cantidad', true)
        const clan = await clanDeposit({ client, guildID: interaction.guild.id, userID: interaction.user.id, amount })
        return interaction.reply({ content: `ƒo. Depositaste **${amount}**. Banco: **${clan.bank}**.`, ephemeral: true })
      }
    },
    {
      name: 'withdraw',
      description: 'Retira del banco del clan (solo dueño)',
      options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true).setMinValue(1)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const amount = interaction.options.getInteger('cantidad', true)
        const clan = await clanWithdraw({ client, guildID: interaction.guild.id, userID: interaction.user.id, amount })
        return interaction.reply({ content: `ƒo. Retiraste **${amount}**. Banco: **${clan.bank}**.`, ephemeral: true })
      }
    },
    {
      name: 'disband',
      description: 'Elimina el clan (solo dueño)',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        await disbandClan({ client, guildID: interaction.guild.id, ownerID: interaction.user.id })
        return interaction.reply({ content: 'ƒo. Clan eliminado.', ephemeral: true })
      }
    },
    {
      name: 'top',
      description: 'Top clanes por banco',
      options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('limite').setDescription('Máx 20').setRequired(false).setMinValue(1).setMaxValue(20)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const limit = interaction.options.getInteger('limite') || 10
        const rows = await topClans({ guildID: interaction.guild.id, limit })
        if (!rows.length) return interaction.reply({ content: 'No hay clanes aún.', ephemeral: true })
        const lines = rows.map((c, i) => `**${i + 1}.** **${c.name}**${c.tag ? ` [${c.tag}]` : ''} • **${c.bank}**`)
        const embed = new EmbedBuilder().setTitle('Top Clanes').setColor('Gold').setDescription(lines.join('\n')).setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    }
  ]
})

