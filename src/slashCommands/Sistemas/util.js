const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const {
  reverseText,
  spoilerText,
  clapText,
  uwuText,
  mockText,
  zalgoText,
  boldText,
  smallcapsText,
  emojiifyText,
  shrinkText,
  expandText,
  censorText
} = require('../../systems/fun/textTransforms')

function unixNow () {
  return Math.floor(Date.now() / 1000)
}

module.exports = createSystemSlashCommand({
  name: 'util',
  description: 'Utilidades generales (texto/tiempo/info)',
  moduleKey: 'util',
  defaultCooldownMs: 1_500,
  groups: [
    {
      name: 'text',
      description: 'Transformaciones de texto',
      subcommands: [
        { name: 'reverse', description: 'Reverse', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(1500)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: reverseText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'spoiler', description: 'Spoiler', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(1500)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: spoilerText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'clap', description: 'Clap', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(1500)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: clapText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'uwu', description: 'Uwu', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(1500)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: uwuText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'mock', description: 'Mock', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(1500)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: mockText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'zalgo', description: 'Zalgo', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(600)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: zalgoText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'bold', description: 'Bold', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(1500)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: boldText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'smallcaps', description: 'Smallcaps', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(1500)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: smallcapsText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'emojiify', description: 'Emojiify', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(800)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: emojiifyText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'shrink', description: 'Shrink', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(1500)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: shrinkText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'expand', description: 'Expand', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(1500)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: expandText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'censor', description: 'Censor', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(1500)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: censorText(i.options.getString('text', true)), ephemeral: true }) }
      ]
    },
    {
      name: 'time',
      description: 'Tiempos/timestamps',
      subcommands: [
        {
          name: 'now',
          description: 'Timestamp actual',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const u = unixNow()
            return interaction.reply({ content: `Ahora: <t:${u}:F> | <t:${u}:R>`, ephemeral: true })
          }
        },
        {
          name: 'from_unix',
          description: 'Convierte unix a timestamp Discord',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('unix').setDescription('Unix (segundos)').setRequired(true).setMinValue(0)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const u = interaction.options.getInteger('unix', true)
            return interaction.reply({ content: `<t:${u}:F> | <t:${u}:R>`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'info',
      description: 'Info rápida',
      subcommands: [
        {
          name: 'avatar',
          description: 'Avatar de un usuario',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario (opcional)').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('user') || interaction.user
            const embed = new EmbedBuilder().setTitle(`Avatar • ${user.username}`).setColor('Blurple').setImage(user.displayAvatarURL({ size: 1024 })).setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        },
        {
          name: 'bot',
          description: 'Info del bot',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const embed = new EmbedBuilder()
              .setTitle('Bot Info')
              .setColor('Green')
              .addFields(
                { name: 'Guilds', value: String(client.guilds.cache.size), inline: true },
                { name: 'WS', value: `${Math.round(client.ws.ping)}ms`, inline: true }
              )
              .setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        }
      ]
    }
  ]
})

