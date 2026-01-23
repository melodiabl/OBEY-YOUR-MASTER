const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js')
const Systems = require('../../../systems')
const Emojis = require('../../../utils/emojis')
const Format = require('../../../utils/formatter')
const { getGuildUiConfig, headerLine, embed, warnEmbed, errorEmbed } = require('../uiKit')

function menuOption (label, value, emoji, description) {
  return { label, value, emoji, description }
}

function makeComponents ({ userId, view }) {
  const uid = String(userId)

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`panel:${uid}:home`).setStyle(ButtonStyle.Secondary).setLabel('Inicio').setEmoji(Emojis.crown),
    new ButtonBuilder().setCustomId(`panel:${uid}:systems`).setStyle(ButtonStyle.Secondary).setLabel('Sistemas').setEmoji(Emojis.system),
    new ButtonBuilder().setCustomId(`panel:${uid}:config`).setStyle(ButtonStyle.Secondary).setLabel('Config').setEmoji(Emojis.theme),
    new ButtonBuilder().setCustomId(`panel:${uid}:help`).setStyle(ButtonStyle.Primary).setLabel('Ayuda').setEmoji(Emojis.info),
    new ButtonBuilder().setCustomId(`panel:${uid}:close`).setStyle(ButtonStyle.Danger).setLabel('Cerrar').setEmoji(Emojis.cancel)
  )

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`panel_menu:${uid}`)
    .setPlaceholder('Salta a un módulo…')
    .addOptions([
      menuOption('Moderación', 'moderation', Emojis.moderation, 'Sanciones y seguridad'),
      menuOption('Música', 'music', Emojis.music, 'Cola, reproducción, filtros'),
      menuOption('Economía', 'economy', Emojis.economy, 'Balance, tienda, acciones'),
      menuOption('Juegos', 'games', Emojis.games, 'Casino y minijuegos'),
      menuOption('Clanes', 'clans', Emojis.clan, 'Progreso en grupo'),
      menuOption('Niveles', 'levels', Emojis.level, 'XP y ranking'),
      menuOption('Reputación', 'reputation', Emojis.reputation, 'Puntos y cooldown'),
      menuOption('Tickets', 'tickets', Emojis.ticket, 'Soporte y staff'),
      menuOption('Utilidad', 'utility', Emojis.utility, 'Herramientas rápidas'),
      menuOption('Infra', 'infra', Emojis.system, 'Plugins y mantenimiento')
    ])

  const menuRow = new ActionRowBuilder().addComponents(menu)
  return [buttons, menuRow]
}

function statusPill (ok) {
  return ok ? `${Emojis.success} on` : `${Emojis.error} off`
}

async function buildPanelEmbed ({ client, guildId, userId, view }) {
  const ui = await getGuildUiConfig(client, guildId)
  const v = String(view || 'home').trim().toLowerCase()

  if (v === 'help') {
    const e = embed({
      ui,
      system: 'info',
      kind: 'info',
      title: `${Emojis.info} Ayuda rápida`,
      description: [
        headerLine(Emojis.info, 'Cómo moverte'),
        `${Emojis.dot} Panel: ${Format.inlineCode('/panel')}`,
        `${Emojis.dot} Ayuda: ${Format.inlineCode('/help')}`,
        `${Emojis.dot} Estado: ${Format.inlineCode('/sistemas')}`,
        Format.softDivider(20),
        `${Emojis.quote} *Tip:* muchos comandos viven como subcomandos (ej: ${Format.inlineCode('/tools ping')}).`
      ].join('\n'),
      signature: 'UX premium, sin texto crudo'
    })
    return { ui, embed: e }
  }

  if (v === 'systems') {
    const fields = [
      { name: `${Emojis.economy} Economía`, value: statusPill(Boolean(Systems.economy)), inline: true },
      { name: `${Emojis.clan} Clanes`, value: statusPill(Boolean(Systems.clans)), inline: true },
      { name: `${Emojis.level} Niveles`, value: statusPill(Boolean(Systems.levels)), inline: true },
      { name: `${Emojis.music} Música`, value: statusPill(Boolean(client.shoukaku)), inline: true },
      { name: `${Emojis.giveaway} Sorteos`, value: statusPill(Boolean(Systems.giveaways)), inline: true },
      { name: `${Emojis.ticket} Tickets`, value: statusPill(Boolean(Systems.tickets)), inline: true },
      { name: `${Emojis.moderation} Moderación`, value: statusPill(Boolean(Systems.moderation)), inline: true },
      { name: `${Emojis.logs} Logs`, value: statusPill(Boolean(Systems.logs)), inline: true }
    ]

    const e = embed({
      ui,
      system: 'info',
      kind: 'info',
      title: `${Emojis.system} Sistemas`,
      description: [
        headerLine(Emojis.system, 'Estado general'),
        `${Emojis.dot} **Ping:** ${Format.inlineCode(`${client.ws.ping}ms`)}`,
        `${Emojis.dot} **Slash cargados:** ${Format.inlineCode(client.slashCommands.size)}`,
        `${Emojis.dot} **Guild:** ${Format.inlineCode(guildId)}`
      ].join('\n'),
      fields,
      signature: 'Todo conectado'
    })
    return { ui, embed: e }
  }

  if (v === 'config') {
    const guildData = await client.db.getGuildData(guildId)
    const modules = guildData?.modules
    const maintenance = Boolean(guildData?.maintenanceEnabled)

    const moduleLines = []
    try {
      if (modules?.get) {
        for (const [k, val] of modules.entries()) moduleLines.push(`${Emojis.dot} ${Format.inlineCode(k)}: ${val === false ? `${Emojis.error} off` : `${Emojis.success} on`}`)
      }
    } catch (e) {}

    const e = embed({
      ui,
      system: 'config',
      kind: maintenance ? 'warn' : 'info',
      title: `${Emojis.theme} Config`,
      description: [
        headerLine(Emojis.system, 'Servidor'),
        `${Emojis.dot} **Tema:** ${Format.inlineCode(guildData?.theme || 'dark')}`,
        `${Emojis.dot} **Prefijo visual:** ${Format.inlineCode(guildData?.visualPrefix || '•')}`,
        `${Emojis.dot} **Mantenimiento:** ${maintenance ? `${Emojis.dnd} on` : `${Emojis.success} off`}`,
        Format.softDivider(20),
        `${Emojis.dot} Logs: ${guildData?.logsChannel ? `<#${guildData.logsChannel}>` : Format.inlineCode('No')}`,
        `${Emojis.dot} Bienvenidas: ${guildData?.welcomeChannel ? `<#${guildData.welcomeChannel}>` : Format.inlineCode('No')}`,
        `${Emojis.dot} Sugerencias: ${guildData?.suggestionChannel ? `<#${guildData.suggestionChannel}>` : Format.inlineCode('No')}`,
        Format.softDivider(20),
        `${Emojis.quote} *Atajos:* ${Format.inlineCode('/config view')} ${Emojis.dot} ${Format.inlineCode('/modules list')} ${Emojis.dot} ${Format.inlineCode('/maintenance status')}`,
        moduleLines.length ? `${Emojis.quote} *Módulos (overrides):*\n${moduleLines.slice(0, 8).join('\n')}` : null
      ].filter(Boolean).join('\n'),
      signature: 'Control total'
    })
    return { ui, embed: e }
  }

  const quick = {
    moderation: {
      system: 'moderation',
      title: `${Emojis.moderation} Moderación`,
      lines: [
        `${Emojis.dot} Sanciones: ${Format.inlineCode('/ban')} ${Emojis.dot} ${Format.inlineCode('/kick')} ${Emojis.dot} ${Format.inlineCode('/timeout')}`,
        `${Emojis.dot} Casos: ${Format.inlineCode('/cases')} (si está habilitado)`,
        `${Emojis.dot} Logs: configura con ${Format.inlineCode('/config logs')}.`
      ]
    },
    music: {
      system: 'music',
      title: `${Emojis.music} Música`,
      lines: [
        `${Emojis.dot} Reproducir: ${Format.inlineCode('/play')} ${Emojis.dot} Cola: ${Format.inlineCode('/queue')}`,
        `${Emojis.dot} Control: ${Format.inlineCode('/pause')} ${Emojis.dot} ${Format.inlineCode('/skip')} ${Emojis.dot} ${Format.inlineCode('/stop')}`,
        `${Emojis.dot} Extra: ${Format.inlineCode('/lyrics')} ${Emojis.dot} ${Format.inlineCode('/volume')}`
      ]
    },
    economy: {
      system: 'economy',
      title: `${Emojis.economy} Economía`,
      lines: [
        `${Emojis.dot} Perfil: ${Format.inlineCode('/balance')} ${Emojis.dot} ${Format.inlineCode('/inventory')}`,
        `${Emojis.dot} Acciones: ${Format.inlineCode('/work')} ${Emojis.dot} ${Format.inlineCode('/daily')} ${Emojis.dot} ${Format.inlineCode('/stream')}`,
        `${Emojis.dot} Juegos: mirá ${Format.inlineCode('/bet')}.`
      ]
    },
    games: {
      system: 'games',
      title: `${Emojis.games} Juegos`,
      lines: [
        `${Emojis.dot} Apuestas: ${Format.inlineCode('/bet')} (${Format.inlineCode('coinflip/dice/slots')})`,
        `${Emojis.dot} Minijuego: ${Format.inlineCode('/guessnumber')}`,
        `${Emojis.dot} Random & dados: ${Format.inlineCode('/tools roll')} ${Emojis.dot} ${Format.inlineCode('/tools coinflip')}`
      ]
    },
    clans: {
      system: 'clans',
      title: `${Emojis.clan} Clanes`,
      lines: [
        `${Emojis.dot} Crear: ${Format.inlineCode('/clan create')}  ${Emojis.dot} Info: ${Format.inlineCode('/clan info')}`,
        `${Emojis.dot} Invitar: ${Format.inlineCode('/clan invite')}  ${Emojis.dot} Aceptar: ${Format.inlineCode('/clan accept')}`
      ]
    },
    levels: {
      system: 'levels',
      title: `${Emojis.level} Niveles`,
      lines: [
        `${Emojis.dot} XP: se gana con mensajes (si está activado).`,
        `${Emojis.dot} Admin: canal de anuncios y rewards en ${Format.inlineCode('/config')}.`
      ]
    },
    reputation: {
      system: 'reputation',
      title: `${Emojis.reputation} Reputación`,
      lines: [
        `${Emojis.dot} Sistema con cooldown y límites diarios (configurable).`,
        `${Emojis.dot} Tip: evitá abuso con ${Format.inlineCode('/overrides')} y módulos.`
      ]
    },
    tickets: {
      system: 'tickets',
      title: `${Emojis.ticket} Tickets`,
      lines: [
        `${Emojis.dot} Abrir: ${Format.inlineCode('/ticket open')}  ${Emojis.dot} Cerrar: ${Format.inlineCode('/ticket close')}`,
        `${Emojis.dot} Staff: ${Format.inlineCode('/ticket claim')} ${Emojis.dot} ${Format.inlineCode('/ticket transfer')}`,
        `${Emojis.dot} Notas: ${Format.inlineCode('/ticket note add')} ${Emojis.dot} ${Format.inlineCode('/ticket note list')}`
      ]
    },
    utility: {
      system: 'utility',
      title: `${Emojis.utility} Utilidad`,
      lines: [
        `${Emojis.dot} Herramientas: ${Format.inlineCode('/tools')} (ping, uptime, avatar, base64, hash, etc.)`,
        `${Emojis.dot} Tip: usa subcomandos para velocidad y orden.`
      ]
    },
    infra: {
      system: 'infra',
      title: `${Emojis.system} Infra`,
      lines: [
        `${Emojis.dot} Plugins: ${Format.inlineCode('/plugins list')} ${Emojis.dot} ${Format.inlineCode('/plugins reload')}`,
        `${Emojis.dot} Mantenimiento: ${Format.inlineCode('/maintenance on')} / ${Format.inlineCode('/maintenance off')}`
      ]
    }
  }

  const selected = quick[v]
  if (selected) {
    const e = embed({
      ui,
      system: selected.system,
      kind: 'info',
      title: selected.title,
      description: [headerLine(Emojis.star, 'Atajos'), ...selected.lines].join('\n'),
      signature: 'Todo está conectado'
    })
    return { ui, embed: e }
  }

  const e = embed({
    ui,
    system: 'info',
    kind: 'info',
    title: `${Emojis.crown} OBEY YOUR MASTER`,
    description: [
      headerLine(Emojis.info, 'Centro de control'),
      `${Emojis.dot} Navega con botones o menú.`,
      `${Emojis.dot} Panel de comandos: ${Format.inlineCode('/help')}`,
      `${Emojis.dot} Estado rápido: ${Format.inlineCode('/sistemas')}`
    ].join('\n'),
    fields: [
      { name: `${Emojis.stats} Resumen`, value: `${Emojis.dot} Slash: ${Format.inlineCode(client.slashCommands.size)}\n${Emojis.dot} Usuarios cache: ${Format.inlineCode(client.users.cache.size)}`, inline: true },
      { name: `${Emojis.system} Modo`, value: `${Emojis.dot} Legacy prefijo: ${Format.inlineCode(String(process.env.LEGACY_PREFIX_MODE || 'compat'))}\n${Emojis.dot} Mantenimiento: ${Format.inlineCode('ver /maintenance status')}`, inline: true }
    ],
    signature: 'Hecho para comunidades grandes'
  })
  return { ui, embed: e }
}

async function buildPanelMessage ({ client, guildId, userId, view }) {
  const { embed: e } = await buildPanelEmbed({ client, guildId, userId, view })
  const components = makeComponents({ userId, view })
  return { embeds: [e], components }
}

async function handlePanelInteraction (client, interaction) {
  if (!interaction.guild) return

  if (interaction.isButton?.()) {
    const raw = String(interaction.customId || '')
    if (!raw.startsWith('panel:')) return null
    const [, ownerId, action] = raw.split(':')
    if (!ownerId || !action) return null

    if (interaction.user.id !== ownerId) {
      const ui = await getGuildUiConfig(client, interaction.guild.id)
      const e = errorEmbed({ ui, system: 'security', title: 'Panel bloqueado', reason: 'Este panel pertenece a otra persona.', hint: 'Abrí el tuyo con /panel.' })
      await interaction.reply({ embeds: [e], ephemeral: true }).catch(() => {})
      return true
    }

    if (action === 'close') {
      const ui = await getGuildUiConfig(client, interaction.guild.id)
      const e = warnEmbed({
        ui,
        system: 'info',
        title: 'Cerrado',
        lines: [`${Emojis.dot} Si lo necesitás de nuevo: ${Format.inlineCode('/panel')}.`]
      })
      await interaction.update({ embeds: [e], components: [] }).catch(() => {})
      return true
    }

    const view = action
    const payload = await buildPanelMessage({ client, guildId: interaction.guild.id, userId: ownerId, view })
    await interaction.update(payload).catch(() => {})
    return true
  }

  if (interaction.isStringSelectMenu?.()) {
    const raw = String(interaction.customId || '')
    if (!raw.startsWith('panel_menu:')) return null
    const [, ownerId] = raw.split(':')
    if (!ownerId) return null

    if (interaction.user.id !== ownerId) {
      const ui = await getGuildUiConfig(client, interaction.guild.id)
      const e = errorEmbed({ ui, system: 'security', title: 'Panel bloqueado', reason: 'Este panel pertenece a otra persona.', hint: 'Abrí el tuyo con /panel.' })
      await interaction.reply({ embeds: [e], ephemeral: true }).catch(() => {})
      return true
    }

    const view = interaction.values?.[0] || 'home'
    const payload = await buildPanelMessage({ client, guildId: interaction.guild.id, userId: ownerId, view })
    await interaction.update(payload).catch(() => {})
    return true
  }

  return null
}

module.exports = {
  buildPanelMessage,
  handlePanelInteraction
}
