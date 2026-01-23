const GuildSchema = require('../../database/schemas/GuildSchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, embed, okEmbed, errorEmbed, headerLine } = require('../../core/ui/uiKit')

function isModuleEnabled (guildData, key) {
  const modules = guildData?.modules
  if (!modules) return true
  if (typeof modules.get === 'function') return modules.get(key) !== false
  return modules?.[key] !== false
}

function cleanSuggestion (text) {
  const s = String(text || '').trim()
  if (!s) return ''
  return s.length > 1500 ? s.slice(0, 1499) + '…' : s
}

class SuggestionService {
  async handleSuggestion (interaction, suggestionText) {
    const client = interaction?.client
    if (!client || !interaction.guild) return

    const ui = await getGuildUiConfig(client, interaction.guild.id)

    const suggestion = cleanSuggestion(suggestionText)
    if (!suggestion) {
      const err = errorEmbed({
        ui,
        system: 'config',
        title: 'Sugerencia vacía',
        reason: 'No puedo enviar una sugerencia sin contenido.',
        hint: 'Escribe una idea concreta y corta (qué, por qué y cómo).'
      })
      return interaction.reply({ embeds: [err], ephemeral: true })
    }

    const guildData = await GuildSchema.findOne({ guildID: interaction.guild.id }).catch(() => null)
    if (!guildData?.suggestionChannel) {
      const err = errorEmbed({
        ui,
        system: 'config',
        title: 'Sugerencias no configuradas',
        reason: 'No hay un canal de sugerencias configurado en este servidor.',
        hint: `Admin: configura el canal con ${Format.inlineCode('/config suggestions')}.`
      })
      return interaction.reply({ embeds: [err], ephemeral: true })
    }

    if (!isModuleEnabled(guildData, 'suggestions')) {
      const err = errorEmbed({
        ui,
        system: 'config',
        title: 'Módulo deshabilitado',
        reason: 'El módulo de sugerencias está deshabilitado en este servidor.',
        hint: `Admin: usa ${Format.inlineCode('/modules set')} para activarlo.`
      })
      return interaction.reply({ embeds: [err], ephemeral: true })
    }

    const channel = interaction.guild.channels.cache.get(guildData.suggestionChannel)
    if (!channel?.send) {
      const err = errorEmbed({
        ui,
        system: 'config',
        title: 'Canal inválido',
        reason: 'El canal de sugerencias no existe o no es accesible.',
        hint: `Admin: revisa ${Format.inlineCode('/config suggestions')}.`
      })
      return interaction.reply({ embeds: [err], ephemeral: true })
    }

    const authorAvatar = interaction.user.displayAvatarURL({ size: 256 })
    const suggestionEmbed = embed({
      ui,
      system: 'polls',
      kind: 'info',
      title: `${Emojis.quest} Sugerencia`,
      description: [
        headerLine(Emojis.polls, 'Nueva propuesta'),
        `${Emojis.quote} ${Format.italic(suggestion)}`,
        '',
        `${Emojis.dot} **Autor:** ${interaction.user} ${Format.subtext(interaction.user.tag)}`,
        `${Emojis.dot} **Estado:** ${Format.bold('Pendiente')} ${Emojis.loading}`
      ].join('\n'),
      thumbnail: authorAvatar,
      footer: 'Vota con ✅ / ❌'
    })

    const suggestionMsg = await channel.send({ embeds: [suggestionEmbed] }).catch(() => null)
    if (suggestionMsg?.react) {
      await suggestionMsg.react('✅').catch(() => {})
      await suggestionMsg.react('❌').catch(() => {})
    }

    const ok = okEmbed({
      ui,
      system: 'polls',
      title: `${Emojis.success} Sugerencia enviada`,
      lines: [
        `${Emojis.dot} Canal: <#${guildData.suggestionChannel}>`,
        suggestionMsg?.url ? `${Emojis.dot} Link: ${suggestionMsg.url}` : null
      ].filter(Boolean)
    })
    return interaction.reply({ embeds: [ok], ephemeral: true })
  }
}

module.exports = new SuggestionService()

