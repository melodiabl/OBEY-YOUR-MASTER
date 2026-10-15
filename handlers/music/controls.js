const obeyUi = require("../assets/system")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { t } = require('../i18n')
const { contract, registry } = require('../assets/registry')

function buildControls(state, { idle = false, assets = registry, locale = state.locale || 'es' } = {}) {
  const rows = [new ActionRowBuilder(), new ActionRowBuilder(), new ActionRowBuilder()]
  for (const entry of contract.musicControls) {
    const labels = { mp_shuffle: 'shuffle', mp_prev: 'previousTrack', mp_toggle: 'pause', mp_skip: 'skip', mp_loop: 'loop', mp_lyrics: 'lyrics', mp_voldown: 'volumeDown', mp_stop: 'stop', mp_volup: 'volumeUp', mp_queue: 'queue', mp_like: 'like', mp_autoplay: 'autoplay' }
    let key = entry.assetKey, label = t(locale, `music.${labels[entry.customId]}`), style = ButtonStyle.Secondary, disabled = idle
    switch (entry.customId) {
      case 'mp_shuffle': style = state.shuffle ? ButtonStyle.Success : style; break
      case 'mp_prev': disabled ||= !state.history?.length; break
      case 'mp_toggle':
        key = state.paused ? 'play' : 'pause'
        label = t(locale, state.paused ? 'music.resume' : 'music.pause')
        style = state.paused ? ButtonStyle.Success : ButtonStyle.Primary
        break
      case 'mp_loop':
        if (state.loop === 'track') key = 'icon.repeat-one'
        style = state.loop === 'track' ? ButtonStyle.Success : state.loop === 'queue' ? ButtonStyle.Primary : style
        label = state.loop === 'track' ? t(locale, 'music.loopTrack') : state.loop === 'queue' ? t(locale, 'music.loopQueue') : label
        break
      case 'mp_voldown': disabled ||= (state.volume ?? 100) <= 0; break
      case 'mp_stop': style = ButtonStyle.Danger; break
      case 'mp_volup': disabled ||= (state.volume ?? 100) >= 200; break
      case 'mp_autoplay': style = state.autoplay ? ButtonStyle.Success : style; break
    }
    rows[entry.row - 1].addComponents(new ButtonBuilder()
      .setCustomId(entry.customId).setLabel(obeyUi.plain(label)).setEmoji(obeyUi.component(assets.emoji(key))).setStyle(style).setDisabled(disabled))
  }
  return rows
}
module.exports = { buildControls }
