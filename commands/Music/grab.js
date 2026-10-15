const obeyMeta = require("../../handlers/presentation/metadata")
const { t, localeFor } = require('../../handlers/i18n')
const { registry } = require('../../handlers/assets/registry')
const { fx, err, E } = require('../../handlers/music/responses')
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'grab', category: 'Music',
  aliases: ['save', 'dm'],
  description: 'Envía por DM la canción actual',
  usage: 'grab',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const locale = localeFor(client, message.guild.id)
    const mstate = client.music?.getState(message.guild.id)
    if (!mstate?.currentTrack) return message.reply({ allowedMentions: { parse: [] }, embeds: [err(t(locale, 'music.noCurrentTrack'))] }).catch(() => {})
    const info = mstate.currentTrack.info || mstate.currentTrack
    const dm = new EmbedBuilder().setColor(require('../../handlers/music/config').config.color.primary)
      .setTitle(`${registry.markup('icon.music')} ${info.title || '?'}`.slice(0, 250))
      .setDescription(`${registry.markup('icon.profile')} **${info.author || '?'}**\n${registry.markup('icon.link')} [${t(locale, 'music.openLink')}](${info.uri || ''})`)
      .setThumbnail(info.artworkUrl || null)
      .setFooter(obeyMeta.asFooter({ text: t(locale, 'music.savedFrom', { server: message.guild.name }) }))
    return message.author.send({ allowedMentions: { parse: [] }, embeds: [dm] })
      .then(() => message.reply({ embeds: [fx(registry.markup('icon.send'), t(locale, 'music.dmSent'))] }).catch(() => {}))
      .catch(() => message.reply({ embeds: [err(t(locale, 'music.dmBlocked'))] }).catch(() => {}))
  },
}
