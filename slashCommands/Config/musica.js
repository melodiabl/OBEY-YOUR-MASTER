const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, PermissionFlagsBits: F } = require('discord.js')
const { requireSetupAccess } = require('../../handlers/setup-access')
const { setupFailureNotice } = require('../../handlers/setup-errors')
const { createCommandCategorySettings, commandCategoryEnabled } = require('../../handlers/command-category-settings')
const { t, localeFor } = require('../../handlers/i18n')

module.exports = {
  name: 'musica',
  description: 'Activar o desactivar los comandos de música',
  memberpermissions: ['ManageGuild'],
  options: [
    {
      StringChoices: {
        name: 'estado',
        description: '¿Activar o desactivar la música?',
        required: true,
        choices: [
          ['Activar',  'on'],
          ['Desactivar', 'off'],
          ['Ver estado', 'status'],
        ],
      },
    },
  ],

  run: async (client, interaction) => {
    const gid    = interaction.guild.id
    const locale = localeFor(client, gid)
    const copy   = (key, variables) => t(locale, `setup.musicCategory.${key}`, variables)
    const context = {
      guildId: gid, actorId: interaction.user.id, channelId: interaction.channelId,
      actorPermission: F.ManageGuild,
    }
    const notice = key => ({ content: copy(key), embeds: [], components: [], allowedMentions: { parse: [] } })
    const buildEmbed = (key, footer) => new EmbedBuilder()
      .setColor(key === 'disabled' || key === 'offSaved' ? 0x6B7280 : 0x22C55E)
      .setTitle(obeyUi.limit(obeyUi.owned(copy('title')), 256))
      .setDescription(obeyUi.limit(obeyUi.owned(copy(key)), 4096))
      .setFooter(obeyMeta.asFooter({ text: footer }))

    await interaction.deferReply({ ephemeral: true })
    try {
      const estado = interaction.options.getString('estado')
      if (!['on', 'off', 'status'].includes(estado)) return interaction.editReply(notice('invalid'))
      await requireSetupAccess(client, context)
      const service = createCommandCategorySettings(client)
      const before = await service.read(gid)
      if (estado === 'status') {
        await requireSetupAccess(client, context)
        const enabled = commandCategoryEnabled(before.values.MUSIC)
        const key = enabled ? (before.present.MUSIC ? 'enabled' : 'defaultEnabled') : 'disabled'
        return interaction.editReply({ embeds: [buildEmbed(key, copy('current'))] })
      }
      const enable = estado === 'on'
      await requireSetupAccess(client, context)
      await service.save(gid, { MUSIC: enable }, before.revision)
      return interaction.editReply({ embeds: [buildEmbed(enable ? 'onSaved' : 'offSaved', copy('changedBy', { user: interaction.user.tag }))] })
    } catch (error) {
      const key = error.code === 'setup_conflict' ? 'conflict' : 'unavailable'
      return interaction.editReply(setupFailureNotice(locale, error, notice(key), 'config/musica'))
    }
  },
}
