const { ChannelType } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { ai } = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed, okEmbed, errorEmbed, warnEmbed } = require('../../core/ui/uiKit')

function clamp (s, max) {
  const v = String(s || '')
  if (v.length <= max) return v
  return v.slice(0, Math.max(0, max - 1)) + '…'
}

module.exports = createSystemSlashCommand({
  name: 'ai',
  description: 'Asistente IA (beta)',
  moduleKey: 'ai',
  subcommands: [
    {
      name: 'ask',
      description: 'Hazle una pregunta a la IA',
      options: [
        {
          apply: (sub) => sub.addStringOption(o =>
            o
              .setName('prompt')
              .setDescription('Tu pregunta o solicitud')
              .setRequired(true)
              .setMaxLength(1200)
          )
        },
        {
          apply: (sub) => sub.addBooleanOption(o =>
            o
              .setName('publico')
              .setDescription('Mostrar la respuesta en el canal (no efímero)')
              .setRequired(false)
          )
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const prompt = interaction.options.getString('prompt', true)
        const wantPublic = Boolean(interaction.options.getBoolean('publico') || false)

        let aiChannelId = null
        try {
          const guildData = await client.db.getGuildData(interaction.guild.id)
          aiChannelId = guildData?.aiChannel || null
        } catch (e) {}

        const isAiChannel = aiChannelId && interaction.channel?.id === aiChannelId
        const ephemeral = wantPublic ? !isAiChannel : true

        if (wantPublic && !isAiChannel) {
          const w = warnEmbed({
            ui,
            system: 'ai',
            title: 'Modo público limitado',
            lines: [
              `${Emojis.dot} Para evitar spam, el modo público solo está permitido en el canal configurado.`,
              `${Emojis.dot} Admin: usa ${Format.inlineCode('/ai setup channel')} para definirlo.`
            ]
          })
          await interaction.reply({ embeds: [w], ephemeral: true })
          return
        }

        try {
          const res = await ai.ask({
            prompt,
            guildName: interaction.guild?.name,
            userTag: interaction.user?.tag,
            userId: interaction.user?.id
          })

          const e = embed({
            ui,
            system: 'ai',
            kind: 'info',
            title: `${Emojis.ai} IA`,
            description: [
              headerLine(Emojis.ai, 'Respuesta'),
              `${Emojis.quote} ${Format.italic(clamp(prompt, 220))}`,
              Format.softDivider(20),
              res.answer || Format.italic('Sin respuesta.')
            ].join('\n'),
            footer: `Model: ${res.model}`,
            signature: 'Úsala con criterio'
          })
          return interaction.reply({ embeds: [e], ephemeral })
        } catch (e) {
          const reason = e?.code === 'missing_openai_key'
            ? 'El sistema IA no está configurado en este host.'
            : (e?.message || 'Error desconocido.')
          const hint = e?.code === 'missing_openai_key'
            ? `Config: define ${Format.inlineCode('OPENAI_API_KEY')} y reinicia.`
            : 'Tip: probá una pregunta más corta y específica.'

          const err = errorEmbed({ ui, system: 'ai', title: 'IA no disponible', reason, hint })
          return interaction.reply({ embeds: [err], ephemeral: true })
        }
      }
    }
  ],
  groups: [
    {
      name: 'setup',
      description: 'Configuración del sistema IA',
      subcommands: [
        {
          name: 'status',
          description: 'Muestra la configuración actual',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
          handler: async (client, interaction) => {
            const ui = await getGuildUiConfig(client, interaction.guild.id)
            const guildData = await client.db.getGuildData(interaction.guild.id)
            const channel = guildData?.aiChannel ? `<#${guildData.aiChannel}>` : Format.inlineCode('No configurado')
            const e = embed({
              ui,
              system: 'ai',
              kind: 'info',
              title: `${Emojis.ai} Config IA`,
              description: [
                headerLine(Emojis.ai, 'Estado'),
                `${Emojis.dot} **Canal:** ${channel}`,
                `${Emojis.dot} **Modelo:** ${Format.inlineCode(String(process.env.OPENAI_MODEL || 'gpt-4o-mini'))}`
              ].join('\n')
            })
            return interaction.reply({ embeds: [e], ephemeral: true })
          }
        },
        {
          name: 'channel',
          description: 'Define el canal donde se permite IA pública',
          options: [
            { apply: (sub) => sub.addChannelOption(o => o.setName('canal').setDescription('Canal de texto').addChannelTypes(ChannelType.GuildText).setRequired(true)) }
          ],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
          handler: async (client, interaction) => {
            const ui = await getGuildUiConfig(client, interaction.guild.id)
            const channel = interaction.options.getChannel('canal', true)
            const guildData = await client.db.getGuildData(interaction.guild.id)
            guildData.aiChannel = channel.id
            await guildData.save()

            const e = okEmbed({
              ui,
              system: 'ai',
              title: `${Emojis.ai} Canal IA configurado`,
              lines: [
                `${Emojis.dot} Canal: <#${channel.id}>`,
                `${Emojis.dot} Tip: ahora ${Format.inlineCode('/ai ask publico:true')} funciona ahí.`
              ]
            })
            return interaction.reply({ embeds: [e], ephemeral: true })
          }
        },
        {
          name: 'off',
          description: 'Desactiva el canal IA pública',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
          handler: async (client, interaction) => {
            const ui = await getGuildUiConfig(client, interaction.guild.id)
            const guildData = await client.db.getGuildData(interaction.guild.id)
            guildData.aiChannel = null
            await guildData.save()

            const e = okEmbed({
              ui,
              system: 'ai',
              title: `${Emojis.ai} Canal IA desactivado`,
              lines: [`${Emojis.dot} La IA seguirá disponible en modo efímero con ${Format.inlineCode('/ai ask')}.`]
            })
            return interaction.reply({ embeds: [e], ephemeral: true })
          }
        }
      ]
    }
  ]
})
