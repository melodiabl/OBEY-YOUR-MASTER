const crypto = require('node:crypto')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed } = require('../../core/ui/uiKit')

function secondsToHms (sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return `${h}h ${m}m ${r}s`
}

function safeMathEval (expr) {
  const raw = String(expr || '').trim()
  if (!raw) throw new Error('Expresión vacía.')
  if (raw.length > 80) throw new Error('Expresión demasiado larga.')
  if (!/^[0-9+\-*/().\s%]+$/.test(raw)) throw new Error('Solo se permiten números y operadores + - * / % ( ).')
  // eslint-disable-next-line no-new-func
  const fn = Function(`"use strict"; return (${raw})`)
  const out = fn()
  if (!Number.isFinite(out)) throw new Error('Resultado inválido.')
  return out
}

function parseDice (raw) {
  const s = String(raw || '').trim().toLowerCase()
  const m = /^(\d{1,3})d(\d{1,4})$/.exec(s)
  if (!m) throw new Error('Formato inválido. Usa XdY (ej: 2d6).')
  const count = Number(m[1])
  const sides = Number(m[2])
  if (count < 1 || count > 100) throw new Error('X debe estar entre 1 y 100.')
  if (sides < 2 || sides > 10000) throw new Error('Y debe estar entre 2 y 10000.')
  return { count, sides }
}

function rollDice ({ count, sides }) {
  const rolls = []
  let total = 0
  for (let i = 0; i < count; i++) {
    const v = 1 + Math.floor(Math.random() * sides)
    rolls.push(v)
    total += v
  }
  return { total, rolls }
}

function snowflakeToTimestamp (id) {
  const s = String(id || '').trim()
  if (!/^\d{17,20}$/.test(s)) throw new Error('Snowflake inválida.')
  const n = BigInt(s)
  const discordEpoch = 1420070400000n
  const ms = Number((n >> 22n) + discordEpoch)
  if (!Number.isFinite(ms)) throw new Error('No se pudo convertir.')
  return ms
}

module.exports = createSystemSlashCommand({
  name: 'tools',
  description: 'Utilidades rápidas (UX premium)',
  moduleKey: 'utility',
  subcommands: [
    {
      name: 'ping',
      description: 'Muestra latencias del bot',
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const ws = client.ws.ping
        const e = embed({
          ui,
          system: 'utility',
          kind: 'info',
          title: `${Emojis.stats} Ping`,
          description: [
            headerLine(Emojis.utility, 'Estado'),
            `${Emojis.dot} **WebSocket:** ${Format.inlineCode(`${ws}ms`)}`,
            `${Emojis.dot} **Shard:** ${Format.inlineCode(String(interaction.guild.shardId ?? 0))}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'uptime',
      description: 'Tiempo encendido del proceso',
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const up = secondsToHms(process.uptime())
        const e = embed({
          ui,
          system: 'utility',
          kind: 'info',
          title: `${Emojis.stats} Uptime`,
          description: [headerLine(Emojis.utility, 'Activo'), `${Emojis.dot} ${Format.inlineCode(up)}`].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'avatar',
      description: 'Avatar de un usuario',
      options: [
        { apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(false)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const user = interaction.options.getUser('usuario') || interaction.user
        const url = user.displayAvatarURL({ size: 1024 })
        const e = embed({
          ui,
          system: 'utility',
          kind: 'info',
          title: `${Emojis.human} Avatar`,
          description: [headerLine(Emojis.utility, user.tag), `${Emojis.dot} ${Format.inlineCode(user.id)}`].join('\n'),
          image: url
        })
        return interaction.reply({ embeds: [e] })
      }
    },
    {
      name: 'banner',
      description: 'Banner de un usuario (si tiene)',
      options: [
        { apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(false)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const user = interaction.options.getUser('usuario') || interaction.user
        const full = await user.fetch().catch(() => null)
        const banner = full?.bannerURL?.({ size: 1024 })
        if (!banner) {
          const e = embed({
            ui,
            system: 'utility',
            kind: 'warn',
            title: `${Emojis.warn} Sin banner`,
            description: [headerLine(Emojis.utility, user.tag), `${Emojis.dot} Este usuario no tiene banner.`].join('\n')
          })
          return interaction.reply({ embeds: [e], ephemeral: true })
        }

        const e = embed({
          ui,
          system: 'utility',
          kind: 'info',
          title: `${Emojis.human} Banner`,
          description: [headerLine(Emojis.utility, user.tag), `${Emojis.dot} ${Format.inlineCode(user.id)}`].join('\n'),
          image: banner
        })
        return interaction.reply({ embeds: [e] })
      }
    },
    {
      name: 'userinfo',
      description: 'Info rápida de un usuario',
      options: [
        { apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(false)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const user = interaction.options.getUser('usuario') || interaction.user
        const created = Math.floor(user.createdTimestamp / 1000)
        const e = embed({
          ui,
          system: 'info',
          kind: 'info',
          title: `${Emojis.info} Usuario`,
          description: [
            headerLine(Emojis.info, user.tag),
            `${Emojis.dot} **ID:** ${Format.inlineCode(user.id)}`,
            `${Emojis.dot} **Cuenta:** <t:${created}:F>  ${Emojis.dot} <t:${created}:R>`,
            `${Emojis.dot} **Bot:** ${user.bot ? '✅ sí' : '❌ no'}`
          ].join('\n'),
          thumbnail: user.displayAvatarURL({ size: 256 })
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'serverinfo',
      description: 'Info rápida del servidor',
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const g = interaction.guild
        const created = Math.floor(g.createdTimestamp / 1000)
        const e = embed({
          ui,
          system: 'info',
          kind: 'info',
          title: `${Emojis.info} Servidor`,
          description: [
            headerLine(Emojis.info, g.name),
            `${Emojis.dot} **ID:** ${Format.inlineCode(g.id)}`,
            `${Emojis.dot} **Creado:** <t:${created}:F>`,
            `${Emojis.dot} **Miembros (cache):** ${Format.inlineCode(g.memberCount)}`
          ].join('\n'),
          thumbnail: g.iconURL({ size: 256 })
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'channelinfo',
      description: 'Info de un canal',
      options: [
        { apply: (sub) => sub.addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(false)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const ch = interaction.options.getChannel('canal') || interaction.channel
        const e = embed({
          ui,
          system: 'info',
          kind: 'info',
          title: `${Emojis.channel} Canal`,
          description: [
            headerLine(Emojis.info, ch.name || 'Canal'),
            `${Emojis.dot} **ID:** ${Format.inlineCode(ch.id)}`,
            `${Emojis.dot} **Tipo:** ${Format.inlineCode(String(ch.type))}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'roleinfo',
      description: 'Info de un rol',
      options: [
        { apply: (sub) => sub.addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(true)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const role = interaction.options.getRole('rol', true)
        const e = embed({
          ui,
          system: 'info',
          kind: 'info',
          title: `${Emojis.role} Rol`,
          description: [
            headerLine(Emojis.info, role.name),
            `${Emojis.dot} **ID:** ${Format.inlineCode(role.id)}`,
            `${Emojis.dot} **Color:** ${Format.inlineCode(role.hexColor)}`,
            `${Emojis.dot} **Miembros:** ${Format.inlineCode(role.members?.size ?? 0)}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'perms',
      description: 'Permisos efectivos (tú o un miembro)',
      options: [
        { apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(false)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const user = interaction.options.getUser('usuario') || interaction.user
        const member = await interaction.guild.members.fetch(user.id).catch(() => null)
        if (!member) return interaction.reply({ content: `${Emojis.error} No pude obtener el miembro.`, ephemeral: true })

        const keys = [
          'Administrator',
          'ManageGuild',
          'ManageChannels',
          'ManageRoles',
          'ManageMessages',
          'BanMembers',
          'KickMembers',
          'ModerateMembers'
        ]
        const lines = keys.map(k => `${Emojis.dot} ${Format.inlineCode(k)}: ${member.permissions.has(k) ? '✅' : '❌'}`)
        const e = embed({
          ui,
          system: 'security',
          kind: 'info',
          title: `${Emojis.security} Permisos`,
          description: [headerLine(Emojis.security, user.tag), ...lines].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'snowflake',
      description: 'Convierte una snowflake a fecha',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('id').setDescription('Snowflake (ID)').setRequired(true).setMaxLength(20)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        try {
          const id = interaction.options.getString('id', true)
          const ms = snowflakeToTimestamp(id)
          const ts = Math.floor(ms / 1000)
          const e = embed({
            ui,
            system: 'utility',
            kind: 'info',
            title: `${Emojis.calendar} Snowflake`,
            description: [
              headerLine(Emojis.utility, 'Timestamp'),
              `${Emojis.dot} **ID:** ${Format.inlineCode(id)}`,
              `${Emojis.dot} **Fecha:** <t:${ts}:F>`,
              `${Emojis.dot} **Relative:** <t:${ts}:R>`
            ].join('\n')
          })
          return interaction.reply({ embeds: [e], ephemeral: true })
        } catch (e) {
          return interaction.reply({ content: `${Emojis.error} ${e.message}`, ephemeral: true })
        }
      }
    },
    {
      name: 'timestamp',
      description: 'Formatea un unix timestamp',
      options: [
        { apply: (sub) => sub.addIntegerOption(o => o.setName('unix').setDescription('Unix (segundos)').setRequired(true).setMinValue(0)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const unix = interaction.options.getInteger('unix', true)
        const e = embed({
          ui,
          system: 'utility',
          kind: 'info',
          title: `${Emojis.calendar} Timestamp`,
          description: [
            headerLine(Emojis.utility, 'Formatos'),
            `${Emojis.dot} **F:** <t:${unix}:F>`,
            `${Emojis.dot} **R:** <t:${unix}:R>`,
            `${Emojis.dot} **T:** <t:${unix}:T>`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'now',
      description: 'Timestamp actual',
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const unix = Math.floor(Date.now() / 1000)
        const e = embed({
          ui,
          system: 'utility',
          kind: 'info',
          title: `${Emojis.calendar} Ahora`,
          description: [headerLine(Emojis.utility, 'Tiempo'), `${Emojis.dot} <t:${unix}:F>`, `${Emojis.dot} <t:${unix}:R>`].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'calc',
      description: 'Calculadora (solo matemáticas)',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('expresion').setDescription('Ej: (2+2)*5').setRequired(true).setMaxLength(80)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        try {
          const expr = interaction.options.getString('expresion', true)
          const out = safeMathEval(expr)
          const e = embed({
            ui,
            system: 'utility',
            kind: 'success',
            title: `${Emojis.success} Calculadora`,
            description: [
              headerLine(Emojis.utility, 'Resultado'),
              `${Emojis.dot} **Expr:** ${Format.inlineCode(expr)}`,
              `${Emojis.dot} **=** ${Format.inlineCode(out)}`
            ].join('\n')
          })
          return interaction.reply({ embeds: [e], ephemeral: true })
        } catch (e) {
          const err = embed({
            ui,
            system: 'utility',
            kind: 'error',
            title: `${Emojis.error} Calculadora`,
            description: [headerLine(Emojis.utility, 'Error'), `${Emojis.quote} ${Format.italic(e.message)}`].join('\n')
          })
          return interaction.reply({ embeds: [err], ephemeral: true })
        }
      }
    },
    {
      name: 'choose',
      description: 'Elige una opción al azar',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('a').setDescription('Opción A').setRequired(true).setMaxLength(60)) },
        { apply: (sub) => sub.addStringOption(o => o.setName('b').setDescription('Opción B').setRequired(true).setMaxLength(60)) },
        { apply: (sub) => sub.addStringOption(o => o.setName('c').setDescription('Opción C').setRequired(false).setMaxLength(60)) },
        { apply: (sub) => sub.addStringOption(o => o.setName('d').setDescription('Opción D').setRequired(false).setMaxLength(60)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const opts = ['a', 'b', 'c', 'd']
          .map(k => interaction.options.getString(k))
          .filter(Boolean)
        const pick = opts[Math.floor(Math.random() * opts.length)]
        const e = embed({
          ui,
          system: 'utility',
          kind: 'success',
          title: `${Emojis.star} Elección`,
          description: [headerLine(Emojis.utility, 'Resultado'), `${Emojis.dot} ${Format.bold(pick)}`].join('\n')
        })
        return interaction.reply({ embeds: [e] })
      }
    },
    {
      name: 'roll',
      description: 'Tira dados (XdY)',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('dados').setDescription('Ej: 2d6').setRequired(true).setMaxLength(10)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        try {
          const dice = parseDice(interaction.options.getString('dados', true))
          const res = rollDice(dice)
          const shown = res.rolls.length <= 25 ? res.rolls.join(', ') : `${res.rolls.slice(0, 25).join(', ')}…`
          const e = embed({
            ui,
            system: 'games',
            kind: 'success',
            title: `${Emojis.games} Dados`,
            description: [
              headerLine(Emojis.games, `${dice.count}d${dice.sides}`),
              `${Emojis.dot} **Tiradas:** ${Format.inlineCode(shown)}`,
              `${Emojis.dot} **Total:** ${Format.inlineCode(res.total)}`
            ].join('\n')
          })
          return interaction.reply({ embeds: [e] })
        } catch (e) {
          return interaction.reply({ content: `${Emojis.error} ${e.message}`, ephemeral: true })
        }
      }
    },
    {
      name: 'coinflip',
      description: 'Cara o cruz',
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const pick = Math.random() < 0.5 ? 'Cara' : 'Cruz'
        const e = embed({
          ui,
          system: 'games',
          kind: 'success',
          title: `${Emojis.bet} Coinflip`,
          description: [headerLine(Emojis.games, 'Resultado'), `${Emojis.dot} ${Format.bold(pick)}`].join('\n')
        })
        return interaction.reply({ embeds: [e] })
      }
    },
    {
      name: 'random',
      description: 'Número aleatorio (min..max)',
      options: [
        { apply: (sub) => sub.addIntegerOption(o => o.setName('min').setDescription('Mínimo').setRequired(true)) },
        { apply: (sub) => sub.addIntegerOption(o => o.setName('max').setDescription('Máximo').setRequired(true)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const min = interaction.options.getInteger('min', true)
        const max = interaction.options.getInteger('max', true)
        if (max < min) return interaction.reply({ content: `${Emojis.error} max debe ser >= min.`, ephemeral: true })
        const v = min + Math.floor(Math.random() * (max - min + 1))
        const e = embed({
          ui,
          system: 'utility',
          kind: 'success',
          title: `${Emojis.diamond} Random`,
          description: [headerLine(Emojis.utility, 'Número'), `${Emojis.dot} ${Format.inlineCode(v)}`].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'uuid',
      description: 'Genera un UUID',
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const id = crypto.randomUUID()
        const e = embed({
          ui,
          system: 'utility',
          kind: 'success',
          title: `${Emojis.id} UUID`,
          description: [headerLine(Emojis.utility, 'Listo'), `${Emojis.dot} ${Format.inlineCode(id)}`].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'base64-encode',
      description: 'Codifica texto a Base64',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('texto').setDescription('Texto').setRequired(true).setMaxLength(300)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const text = interaction.options.getString('texto', true)
        const b64 = Buffer.from(text, 'utf8').toString('base64')
        const e = embed({
          ui,
          system: 'utility',
          kind: 'info',
          title: `${Emojis.lock} Base64`,
          description: [headerLine(Emojis.utility, 'Encode'), Format.codeBlock(b64)].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'base64-decode',
      description: 'Decodifica Base64 a texto',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('base64').setDescription('Base64').setRequired(true).setMaxLength(400)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        try {
          const b64 = interaction.options.getString('base64', true).trim()
          const text = Buffer.from(b64, 'base64').toString('utf8')
          const e = embed({
            ui,
            system: 'utility',
            kind: 'info',
            title: `${Emojis.unlock} Base64`,
            description: [headerLine(Emojis.utility, 'Decode'), Format.codeBlock(text)].join('\n')
          })
          return interaction.reply({ embeds: [e], ephemeral: true })
        } catch (e) {
          return interaction.reply({ content: `${Emojis.error} Base64 inválido.`, ephemeral: true })
        }
      }
    },
    {
      name: 'hash',
      description: 'SHA-256 de un texto',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('texto').setDescription('Texto').setRequired(true).setMaxLength(400)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const text = interaction.options.getString('texto', true)
        const hash = crypto.createHash('sha256').update(text, 'utf8').digest('hex')
        const e = embed({
          ui,
          system: 'utility',
          kind: 'info',
          title: `${Emojis.lock} SHA-256`,
          description: [headerLine(Emojis.utility, 'Hash'), Format.codeBlock(hash)].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'color',
      description: 'Muestra un color por HEX',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('hex').setDescription('#RRGGBB').setRequired(true).setMaxLength(7)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const hex = String(interaction.options.getString('hex', true)).trim()
        const m = /^#?([0-9a-fA-F]{6})$/.exec(hex)
        if (!m) return interaction.reply({ content: `${Emojis.error} HEX inválido. Usa #RRGGBB.`, ephemeral: true })
        const int = parseInt(m[1], 16)
        const e = embed({
          ui,
          system: 'utility',
          kind: 'info',
          title: `${Emojis.theme} Color`,
          description: [headerLine(Emojis.utility, 'Preview'), `${Emojis.dot} ${Format.inlineCode('#' + m[1].toUpperCase())}`].join('\n')
        }).setColor(int)
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'text-length',
      description: 'Cuenta caracteres de un texto',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('texto').setDescription('Texto').setRequired(true).setMaxLength(1000)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const text = interaction.options.getString('texto', true)
        const e = embed({
          ui,
          system: 'utility',
          kind: 'info',
          title: `${Emojis.info} Longitud`,
          description: [headerLine(Emojis.utility, 'Resultado'), `${Emojis.dot} **Chars:** ${Format.inlineCode(text.length)}`].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'reverse',
      description: 'Invierte un texto',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('texto').setDescription('Texto').setRequired(true).setMaxLength(400)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const text = interaction.options.getString('texto', true)
        const out = text.split('').reverse().join('')
        const e = embed({
          ui,
          system: 'utility',
          kind: 'info',
          title: `${Emojis.utility} Reverse`,
          description: [headerLine(Emojis.utility, 'Resultado'), Format.codeBlock(out)].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'upper',
      description: 'Convierte un texto a MAYÚSCULAS',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('texto').setDescription('Texto').setRequired(true).setMaxLength(400)) }
      ],
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const text = interaction.options.getString('texto', true)
        const out = text.toUpperCase()
        const e = embed({
          ui,
          system: 'utility',
          kind: 'info',
          title: `${Emojis.utility} Upper`,
          description: [headerLine(Emojis.utility, 'Resultado'), Format.codeBlock(out)].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    }
  ]
})
