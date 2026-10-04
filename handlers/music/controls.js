const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { contract, registry } = require('../assets/registry')

function buildControls(state, { idle = false, assets = registry } = {}) {
  const rows = [new ActionRowBuilder(), new ActionRowBuilder(), new ActionRowBuilder()]
  for (const entry of contract.musicControls) {
    let key = entry.assetKey, label = entry.label, style = ButtonStyle.Secondary, disabled = idle
    switch (entry.customId) {
      case 'mp_shuffle': style = state.shuffle ? ButtonStyle.Success : style; break
      case 'mp_prev': disabled ||= !state.history?.length; break
      case 'mp_toggle':
        key = state.paused ? 'play' : 'pause'
        label = state.paused ? 'Reanudar' : 'Pausar'
        style = state.paused ? ButtonStyle.Success : ButtonStyle.Primary
        break
      case 'mp_loop':
        style = state.loop === 'track' ? ButtonStyle.Success : state.loop === 'queue' ? ButtonStyle.Primary : style
        label = state.loop === 'track' ? 'Repetir canción' : state.loop === 'queue' ? 'Repetir cola' : label
        break
      case 'mp_voldown': disabled ||= (state.volume ?? 100) <= 0; break
      case 'mp_stop': style = ButtonStyle.Danger; break
      case 'mp_volup': disabled ||= (state.volume ?? 100) >= 200; break
      case 'mp_autoplay': style = state.autoplay ? ButtonStyle.Success : style; break
    }
    rows[entry.row - 1].addComponents(new ButtonBuilder()
      .setCustomId(entry.customId).setLabel(label).setEmoji(assets.emoji(key)).setStyle(style).setDisabled(disabled))
  }
  return rows
}
module.exports = { buildControls }
