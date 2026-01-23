const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const PERMS = require('../../core/auth/permissionKeys')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { getGuildUiConfig, invalidateGuildUiConfig, headerLine, embed } = require('../../core/ui/uiKit')

function normalizeTheme (v) {
  const t = String(v || '').trim().toLowerCase()
  if (t === 'light') return 'light'
  return 'dark'
}

function knownEmojiKeys () {
  return Object.keys(Emojis).sort((a, b) => a.localeCompare(b))
}

function ensureMap (v) {
  if (!v) return new Map()
  if (typeof v.get === 'function') return v
  return new Map(Object.entries(v))
}

module.exports = {
  MODULE: 'config',
  INTERNAL_ROLE: INTERNAL_ROLES.ADMIN,
  INTERNAL_PERMS: [PERMS.CONFIG_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configuración del servidor (panel premium)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('logs')
        .setDescription('Configura el canal de auditoría')
        .addChannelOption(o => o.setName('canal').setDescription('Canal para registros').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('suggestions')
        .setDescription('Configura el sistema de sugerencias')
        .addChannelOption(o => o.setName('canal').setDescription('Canal para sugerencias').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('welcome')
        .setDescription('Configura el sistema de bienvenidas')
        .addChannelOption(o => o.setName('canal').setDescription('Canal para bienvenidas').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('Muestra la configuración actual')
    )
    .addSubcommandGroup(g =>
      g.setName('ui')
        .setDescription('Identidad visual del bot (tema/emojis/prefijos)')
        .addSubcommand(sub =>
          sub.setName('theme')
            .setDescription('Cambia el tema visual')
            .addStringOption(o => o.setName('modo').setDescription('Tema').setRequired(true).addChoices(
              { name: 'dark', value: 'dark' },
              { name: 'light', value: 'light' }
            ))
        )
        .addSubcommand(sub =>
          sub.setName('prefix')
            .setDescription('Cambia el prefijo visual (listas/ayudas)')
            .addStringOption(o => o.setName('prefijo').setDescription('Ej: •  ─  →').setRequired(true).setMaxLength(3))
        )
        .addSubcommand(sub =>
          sub.setName('emoji-set')
            .setDescription('Override de emoji por clave')
            .addStringOption(o => o.setName('clave').setDescription('Ej: music / moderation / success').setRequired(true).setMaxLength(32))
            .addStringOption(o => o.setName('emoji').setDescription('Unicode o <a:name:id> / <:name:id>').setRequired(true).setMaxLength(64))
        )
        .addSubcommand(sub =>
          sub.setName('emoji-reset')
            .setDescription('Resetea overrides de emojis')
            .addStringOption(o => o.setName('clave').setDescription('Si lo dejas vacío, resetea todos').setRequired(false).setMaxLength(32))
        )
        .addSubcommand(sub =>
          sub.setName('emoji-list')
            .setDescription('Lista claves disponibles y overrides actuales')
        )
    ),

  async execute (client, interaction) {
    const group = interaction.options.getSubcommandGroup(false)
    const sub = interaction.options.getSubcommand()
    const guildId = interaction.guild.id

    const guildData = await client.db.getGuildData(guildId)
    const ui = await getGuildUiConfig(client, guildId)

    if (group === 'ui') {
      if (sub === 'theme') {
        const mode = normalizeTheme(interaction.options.getString('modo', true))
        guildData.theme = mode
        await guildData.save()
        invalidateGuildUiConfig(guildId)

        const e = embed({
          ui,
          system: 'config',
          kind: 'success',
          title: `${Emojis.theme} UI actualizada`,
          description: [
            headerLine(Emojis.system, 'Tema aplicado'),
            `${Emojis.dot} **Tema:** ${Format.inlineCode(mode)}`,
            `${Emojis.dot} **Permisos:** ${Emojis.moderation} ${Format.inlineCode('ADMIN')}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }

      if (sub === 'prefix') {
        const prefix = String(interaction.options.getString('prefijo', true)).trim()
        if (!prefix) return interaction.reply({ content: `${Emojis.error} Prefijo inválido.`, ephemeral: true })
        guildData.visualPrefix = prefix.slice(0, 3)
        await guildData.save()
        invalidateGuildUiConfig(guildId)

        const e = embed({
          ui,
          system: 'config',
          kind: 'success',
          title: `${Emojis.system} UI actualizada`,
          description: [
            headerLine(Emojis.system, 'Prefijo visual'),
            `${Emojis.dot} **Prefijo:** ${Format.inlineCode(guildData.visualPrefix)}`,
            `${Emojis.dot} **Preview:**\n${guildData.visualPrefix} ${Format.bold('Lista')}\n${guildData.visualPrefix} ${Format.italic('Detalle')}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }

      if (sub === 'emoji-set') {
        const key = String(interaction.options.getString('clave', true)).trim()
        const value = String(interaction.options.getString('emoji', true)).trim()
        if (!key) return interaction.reply({ content: `${Emojis.error} Clave inválida.`, ephemeral: true })
        if (!value) return interaction.reply({ content: `${Emojis.error} Emoji inválido.`, ephemeral: true })

        const keys = new Set(knownEmojiKeys())
        if (!keys.has(key)) {
          return interaction.reply({
            content: `${Emojis.error} Clave desconocida: ${Format.inlineCode(key)}\n${Emojis.dot} Usa ${Format.inlineCode('/config ui emoji-list')} para ver claves.`,
            ephemeral: true
          })
        }

        const map = ensureMap(guildData.emojiOverrides)
        map.set(key, value)
        guildData.emojiOverrides = map
        await guildData.save()
        invalidateGuildUiConfig(guildId)

        const e = embed({
          ui,
          system: 'config',
          kind: 'success',
          title: `${Emojis.system} Emoji override`,
          description: [
            headerLine(Emojis.system, 'Emoji actualizado'),
            `${Emojis.dot} **Clave:** ${Format.inlineCode(key)}`,
            `${Emojis.dot} **Nuevo:** ${value}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }

      if (sub === 'emoji-reset') {
        const key = interaction.options.getString('clave')?.trim()
        const map = ensureMap(guildData.emojiOverrides)

        if (!key) map.clear()
        else map.delete(key)

        guildData.emojiOverrides = map
        await guildData.save()
        invalidateGuildUiConfig(guildId)

        const e = embed({
          ui,
          system: 'config',
          kind: 'success',
          title: `${Emojis.system} Emojis reseteados`,
          description: [
            headerLine(Emojis.system, 'Listo'),
            key ? `${Emojis.dot} Reseteado: ${Format.inlineCode(key)}` : `${Emojis.dot} Reseteados: ${Format.inlineCode('TODOS')}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }

      if (sub === 'emoji-list') {
        const map = ensureMap(guildData.emojiOverrides)
        const overrides = []
        for (const [k, v] of map.entries()) overrides.push(`${Emojis.dot} ${Format.inlineCode(k)} → ${v}`)

        const keys = knownEmojiKeys().slice(0, 60).map(k => `${Emojis.dot} ${Format.inlineCode(k)}`).join('\n')
        const e = embed({
          ui,
          system: 'config',
          kind: 'info',
          title: `${Emojis.system} Emojis`,
          description: [
            headerLine(Emojis.system, 'Claves y overrides'),
            `${Emojis.quote} *Claves disponibles (muestra parcial):*`,
            keys || '*Sin claves*',
            '',
            `${Emojis.quote} *Overrides actuales:*`,
            overrides.join('\n') || '*Sin overrides*'
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    }

    if (sub === 'view') {
      const modules = ensureMap(guildData.modules)
      const moduleLines = []
      for (const [k, v] of modules.entries()) moduleLines.push(`${Emojis.dot} ${Format.inlineCode(k)}: ${v === false ? '❌ off' : '✅ on'}`)

      const e = embed({
        ui,
        system: 'config',
        kind: 'info',
        title: `${Emojis.system} Configuración`,
        description: [
          headerLine(Emojis.system, 'Estado del servidor'),
          `${Emojis.dot} **Tema:** ${Format.inlineCode(guildData.theme || 'dark')}`,
          `${Emojis.dot} **Prefijo visual:** ${Format.inlineCode(guildData.visualPrefix || '•')}`,
          Format.softDivider(20),
          `${Emojis.dot} **Logs:** ${guildData.logsChannel ? `<#${guildData.logsChannel}>` : Format.inlineCode('No configurado')}`,
          `${Emojis.dot} **Sugerencias:** ${guildData.suggestionChannel ? `<#${guildData.suggestionChannel}>` : Format.inlineCode('No configurado')}`,
          `${Emojis.dot} **Bienvenidas:** ${guildData.welcomeChannel ? `<#${guildData.welcomeChannel}>` : Format.inlineCode('No configurado')}`,
          Format.softDivider(20),
          `${Emojis.quote} *Módulos:*`,
          moduleLines.join('\n') || '*Sin módulos configurados*'
        ].join('\n'),
        footer: `Servidor: ${guildId}`
      })

      return interaction.reply({ embeds: [e], ephemeral: true })
    }

    const channel = interaction.options.getChannel('canal', true)

    if (sub === 'logs') {
      guildData.logsChannel = channel.id
      await guildData.save()
      const e = embed({
        ui,
        system: 'logs',
        kind: 'success',
        title: `${Emojis.logs} Logs configurados`,
        description: [headerLine(Emojis.logs, 'Canal vinculado'), `${Emojis.dot} Canal: <#${channel.id}>`].join('\n')
      })
      return interaction.reply({ embeds: [e], ephemeral: true })
    }

    if (sub === 'suggestions') {
      guildData.suggestionChannel = channel.id
      await guildData.save()
      const e = embed({
        ui,
        system: 'config',
        kind: 'success',
        title: `${Emojis.system} Sugerencias configuradas`,
        description: [headerLine(Emojis.system, 'Canal vinculado'), `${Emojis.dot} Canal: <#${channel.id}>`].join('\n')
      })
      return interaction.reply({ embeds: [e], ephemeral: true })
    }

    if (sub === 'welcome') {
      guildData.welcomeChannel = channel.id
      await guildData.save()
      const e = embed({
        ui,
        system: 'config',
        kind: 'success',
        title: `${Emojis.system} Bienvenidas configuradas`,
        description: [headerLine(Emojis.system, 'Canal vinculado'), `${Emojis.dot} Canal: <#${channel.id}>`].join('\n')
      })
      return interaction.reply({ embeds: [e], ephemeral: true })
    }
  }
}
