const { ChannelType, PermissionsBitField } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const TempVoiceChannelSchema = require('../../database/schemas/TempVoiceChannelSchema')
const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyInfo, replyOk, replyWarn } = require('../../core/ui/interactionKit')
const { headerLine } = require('../../core/ui/uiKit')

function clamp (n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}

function ensurePerms (guild, me) {
  const m = me || guild?.members?.me
  if (!m) return null
  const need = [
    PermissionsBitField.Flags.ManageChannels,
    PermissionsBitField.Flags.MoveMembers
  ]
  const missing = need.filter(p => !m.permissions.has(p))
  return missing.length ? missing : null
}

module.exports = createSystemSlashCommand({
  name: 'voice',
  description: 'Voice tools avanzados (temp/lock/move/bitrate)',
  moduleKey: 'voice',
  subcommands: [
    {
      name: 'status',
      description: 'Muestra configuraciÃ³n y estado de temp voice',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.VOICE_MANAGE] },
      handler: async (client, interaction) => {
        const gd = await client.db.getGuildData(interaction.guild.id)
        const lobby = gd.voiceTempLobbyChannel ? `<#${gd.voiceTempLobbyChannel}>` : Format.italic('no configurado')
        const cat = gd.voiceTempCategory ? `<#${gd.voiceTempCategory}>` : Format.italic('heredar')
        const count = await TempVoiceChannelSchema.countDocuments({ guildID: interaction.guild.id }).catch(() => 0)

        return replyEmbed(client, interaction, {
          system: 'voice',
          kind: 'info',
          title: `${Emojis.voice} Voice`,
          description: [
            headerLine(Emojis.voice, 'Estado'),
            `${Emojis.dot} Temp voice: ${gd.voiceTempEnabled ? `${Emojis.success} on` : `${Emojis.error} off`}`,
            `${Emojis.dot} Lobby: ${lobby}`,
            `${Emojis.dot} CategorÃ­a: ${cat}`,
            `${Emojis.dot} Template: ${Format.inlineCode(gd.voiceTempNameTemplate || 'n/a')}`,
            `${Emojis.dot} Bitrate: ${Format.inlineCode(String(gd.voiceTempBitrate || 0))} ${Format.subtext('0 = no tocar')}`,
            `${Emojis.dot} LÃ­mite: ${Format.inlineCode(String(gd.voiceTempUserLimit || 0))} ${Format.subtext('0 = ilimitado')}`,
            `${Emojis.dot} Lock on create: ${gd.voiceTempLockOnCreate ? `${Emojis.lock} sÃ­` : `${Emojis.unlock} no`}`,
            `${Emojis.dot} Canales temporales activos: ${Format.inlineCode(String(count))}`
          ].join('\n'),
          signature: `Setup: ${Format.inlineCode('/voice temp setup')}`
        }, { ephemeral: true })
      }
    },
    {
      name: 'lock',
      description: 'Bloquea un canal de voz (deniega Connect a @everyone)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.VOICE_MANAGE] },
      options: [
        { apply: (sub) => sub.addChannelOption(o => o.setName('canal').setDescription('Canal de voz (opcional)').setRequired(false).addChannelTypes(ChannelType.GuildVoice)) }
      ],
      handler: async (client, interaction) => {
        const channel = interaction.options.getChannel('canal') || interaction.member?.voice?.channel
        if (!channel) {
          return replyWarn(client, interaction, { system: 'voice', title: 'Sin canal', lines: ['Debes estar en un canal de voz o especificar uno.'] }, { ephemeral: true })
        }
        const missing = ensurePerms(interaction.guild)
        if (missing) {
          return replyWarn(client, interaction, { system: 'voice', title: 'Faltan permisos del bot', lines: ['Requiere: `ManageChannels` y `MoveMembers`.'] }, { ephemeral: true })
        }

        await Systems.voice.lockChannel({ channel, reason: `Voice lock by ${interaction.user.id}` })
        await TempVoiceChannelSchema.updateOne({ guildID: interaction.guild.id, channelID: channel.id }, { $set: { locked: true } }).catch(() => {})

        return replyOk(client, interaction, {
          system: 'voice',
          title: 'Canal bloqueado',
          lines: [
            `${Emojis.dot} Canal: ${channel}`,
            `${Emojis.dot} Estado: ${Emojis.lock} lock`,
            `${Emojis.dot} Tip: ${Format.inlineCode('/voice unlock')}`
          ]
        }, { ephemeral: true })
      }
    },
    {
      name: 'unlock',
      description: 'Desbloquea un canal de voz (permite Connect a @everyone)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.VOICE_MANAGE] },
      options: [
        { apply: (sub) => sub.addChannelOption(o => o.setName('canal').setDescription('Canal de voz (opcional)').setRequired(false).addChannelTypes(ChannelType.GuildVoice)) }
      ],
      handler: async (client, interaction) => {
        const channel = interaction.options.getChannel('canal') || interaction.member?.voice?.channel
        if (!channel) {
          return replyWarn(client, interaction, { system: 'voice', title: 'Sin canal', lines: ['Debes estar en un canal de voz o especificar uno.'] }, { ephemeral: true })
        }
        const missing = ensurePerms(interaction.guild)
        if (missing) {
          return replyWarn(client, interaction, { system: 'voice', title: 'Faltan permisos del bot', lines: ['Requiere: `ManageChannels` y `MoveMembers`.'] }, { ephemeral: true })
        }

        await Systems.voice.unlockChannel({ channel, reason: `Voice unlock by ${interaction.user.id}` })
        await TempVoiceChannelSchema.updateOne({ guildID: interaction.guild.id, channelID: channel.id }, { $set: { locked: false } }).catch(() => {})

        return replyOk(client, interaction, {
          system: 'voice',
          title: 'Canal desbloqueado',
          lines: [
            `${Emojis.dot} Canal: ${channel}`,
            `${Emojis.dot} Estado: ${Emojis.unlock} unlock`
          ]
        }, { ephemeral: true })
      }
    },
    {
      name: 'move',
      description: 'Mueve un usuario entre canales de voz',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.VOICE_MANAGE] },
      options: [
        { apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)) },
        { apply: (sub) => sub.addChannelOption(o => o.setName('destino').setDescription('Canal de voz destino').setRequired(true).addChannelTypes(ChannelType.GuildVoice)) }
      ],
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario', true)
        const dest = interaction.options.getChannel('destino', true)
        const member = await interaction.guild.members.fetch(user.id).catch(() => null)
        if (!member?.voice?.channel) {
          return replyWarn(client, interaction, { system: 'voice', title: 'No estÃ¡ en voz', lines: [`${user} no estÃ¡ en un canal de voz.`] }, { ephemeral: true })
        }

        const missing = ensurePerms(interaction.guild)
        if (missing) {
          return replyWarn(client, interaction, { system: 'voice', title: 'Faltan permisos del bot', lines: ['Requiere: `ManageChannels` y `MoveMembers`.'] }, { ephemeral: true })
        }

        await member.voice.setChannel(dest, `Voice move by ${interaction.user.id}`)
        return replyOk(client, interaction, {
          system: 'voice',
          title: 'Usuario movido',
          lines: [
            `${Emojis.dot} Usuario: ${user} (${Format.inlineCode(user.id)})`,
            `${Emojis.dot} De: ${member.voice.channel} â†’ A: ${dest}`
          ]
        }, { ephemeral: true })
      }
    },
    {
      name: 'bitrate',
      description: 'Ajusta bitrate de un canal de voz',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.VOICE_MANAGE] },
      options: [
        { apply: (sub) => sub.addIntegerOption(o => o.setName('kbps').setDescription('Bitrate en kbps (8-384)').setRequired(true).setMinValue(8).setMaxValue(384)) },
        { apply: (sub) => sub.addChannelOption(o => o.setName('canal').setDescription('Canal de voz (opcional)').setRequired(false).addChannelTypes(ChannelType.GuildVoice)) }
      ],
      handler: async (client, interaction) => {
        const channel = interaction.options.getChannel('canal') || interaction.member?.voice?.channel
        const kbps = interaction.options.getInteger('kbps', true)
        if (!channel) {
          return replyWarn(client, interaction, { system: 'voice', title: 'Sin canal', lines: ['Debes estar en un canal de voz o especificar uno.'] }, { ephemeral: true })
        }
        const bitrate = clamp(kbps * 1000, 8000, 384000)
        await channel.setBitrate(bitrate, `Voice bitrate by ${interaction.user.id}`)
        return replyOk(client, interaction, {
          system: 'voice',
          title: 'Bitrate actualizado',
          lines: [
            `${Emojis.dot} Canal: ${channel}`,
            `${Emojis.dot} Bitrate: ${Format.inlineCode(`${kbps}kbps`)}`
          ]
        }, { ephemeral: true })
      }
    }
  ],
  groups: [
    {
      name: 'temp',
      description: 'Canales temporales (join-to-create)',
      subcommands: [
        {
          name: 'setup',
          description: 'Configura lobby/categorÃ­a/template/limites',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.VOICE_MANAGE] },
          options: [
            { apply: (sub) => sub.addBooleanOption(o => o.setName('activo').setDescription('Habilitar temp voice').setRequired(true)) },
            { apply: (sub) => sub.addChannelOption(o => o.setName('lobby').setDescription('Canal de voz lobby (join-to-create)').setRequired(true).addChannelTypes(ChannelType.GuildVoice)) },
            { apply: (sub) => sub.addChannelOption(o => o.setName('categoria').setDescription('CategorÃ­a (opcional)').setRequired(false).addChannelTypes(ChannelType.GuildCategory)) },
            { apply: (sub) => sub.addStringOption(o => o.setName('template').setDescription('Ej: ðŸŽ§ {user} | {tag} | {id}').setRequired(false).setMaxLength(80)) },
            { apply: (sub) => sub.addIntegerOption(o => o.setName('bitrate_kbps').setDescription('0=no tocar, 8-384').setRequired(false).setMinValue(0).setMaxValue(384)) },
            { apply: (sub) => sub.addIntegerOption(o => o.setName('limite').setDescription('0=ilimitado, 1-99').setRequired(false).setMinValue(0).setMaxValue(99)) },
            { apply: (sub) => sub.addBooleanOption(o => o.setName('lock').setDescription('Lock al crear').setRequired(false)) }
          ],
          handler: async (client, interaction) => {
            const gd = await client.db.getGuildData(interaction.guild.id)
            const active = Boolean(interaction.options.getBoolean('activo', true))
            const lobby = interaction.options.getChannel('lobby', true)
            const cat = interaction.options.getChannel('categoria')
            const template = interaction.options.getString('template')
            const bitrateKbps = interaction.options.getInteger('bitrate_kbps')
            const limit = interaction.options.getInteger('limite')
            const lock = interaction.options.getBoolean('lock')

            gd.voiceTempEnabled = active
            gd.voiceTempLobbyChannel = lobby.id
            gd.voiceTempCategory = cat ? cat.id : null
            if (template) gd.voiceTempNameTemplate = template
            if (bitrateKbps !== null && bitrateKbps !== undefined) gd.voiceTempBitrate = clamp(bitrateKbps * 1000, 0, 384000)
            if (limit !== null && limit !== undefined) gd.voiceTempUserLimit = clamp(limit, 0, 99)
            if (lock !== null && lock !== undefined) gd.voiceTempLockOnCreate = Boolean(lock)
            await gd.save()

            return replyOk(client, interaction, {
              system: 'voice',
              title: 'Temp voice configurado',
              lines: [
                `${Emojis.dot} Estado: ${active ? `${Emojis.success} on` : `${Emojis.error} off`}`,
                `${Emojis.dot} Lobby: ${lobby}`,
                `${Emojis.dot} CategorÃ­a: ${cat || Format.italic('heredar')}`,
                `${Emojis.dot} Template: ${Format.inlineCode(gd.voiceTempNameTemplate)}`,
                `${Emojis.dot} Bitrate: ${Format.inlineCode(String(gd.voiceTempBitrate || 0))}`,
                `${Emojis.dot} LÃ­mite: ${Format.inlineCode(String(gd.voiceTempUserLimit || 0))}`,
                `${Emojis.dot} Lock on create: ${gd.voiceTempLockOnCreate ? `${Emojis.lock} sÃ­` : `${Emojis.unlock} no`}`
              ],
              signature: 'Prueba: entra al lobby para crear tu canal'
            }, { ephemeral: true })
          }
        },
        {
          name: 'list',
          description: 'Lista canales temporales activos',
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.VOICE_MANAGE] },
          handler: async (client, interaction) => {
            const docs = await TempVoiceChannelSchema.find({ guildID: interaction.guild.id }).sort({ createdAt: -1 }).limit(20).catch(() => [])
            if (!docs.length) {
              return replyWarn(client, interaction, { system: 'voice', title: 'Sin canales', lines: ['No hay canales temporales registrados.'] }, { ephemeral: true })
            }
            const lines = docs.map(d => {
              const ch = interaction.guild.channels.cache.get(d.channelID)
              const channel = ch ? ch.toString() : Format.inlineCode(d.channelID)
              const lock = d.locked ? Emojis.lock : Emojis.unlock
              return `${Emojis.dot} ${channel} â€” owner <@${d.ownerID}> â€” ${lock}`
            })
            return replyInfo(client, interaction, {
              system: 'voice',
              title: 'Temp voice (activos)',
              lines
            }, { ephemeral: true })
          }
        }
      ]
    }
  ]
})
