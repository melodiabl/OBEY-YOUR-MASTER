const { runLyrics } = require('../../handlers/music/lyrics-command')
const { EmbedBuilder } = require('discord.js')
const { localeFor, t } = require('../../handlers/i18n')
module.exports = {
  name: 'lyrics',
  category: 'Music',
  aliases: ['songlyrics', 'ly', 'tracklyrics'],
  description: 'Muestra la letra de la canción actual',
  usage: 'lyrics [título]',
  cooldown: 15,
  parameters: { type: 'music', activeplayer: false, previoussong: false },

  run: async (client, message, args = []) => {
    const locale = localeFor(client, message.guild.id)
    const loading = await message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
      .setDescription(t(locale, 'music.lyricsLoading'))], allowedMentions: { parse: [] } })
    return runLyrics(client, { user: message.author, guildId: message.guild.id,
      editReply: payload => loading.edit(payload) }, args.join(' '))
  },
}
