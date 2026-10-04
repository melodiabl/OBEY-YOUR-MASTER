const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const registry = require('../contracts/assets.registry.json');
const fallback = {
  shuffle: '🔀', previous: '⏮️', pause: '⏸️', play: '▶️', skip: '⏭️', repeat: '🔁',
  lyrics: '🎵', vol_down: '🔉', stop: '⏹️', vol_up: '🔊', queue: '📋', heart: '💛', autoplay: '🎶',
};
// Pass verified application emoji IDs after uploading the supplied PNG exports.
function buildCharacterControls(state, applicationEmojiIds = {}) {
  const rows = [new ActionRowBuilder(), new ActionRowBuilder(), new ActionRowBuilder()];
  for (const entry of registry.musicControls) {
    let key = entry.assetKey;
    let label = entry.label;
    let style = ButtonStyle.Secondary;
    let disabled = false;
    switch (entry.customId) {
      case 'mp_shuffle': style = state.shuffle ? ButtonStyle.Success : style; break;
      case 'mp_prev': disabled = !state.history?.length; break;
      case 'mp_toggle':
        key = state.paused ? 'play' : 'pause';
        label = state.paused ? 'Reanudar' : 'Pausar';
        style = state.paused ? ButtonStyle.Success : ButtonStyle.Primary; break;
      case 'mp_loop':
        style = state.loop === 'track' ? ButtonStyle.Success : state.loop === 'queue' ? ButtonStyle.Primary : style;
        label = state.loop === 'track' ? 'Repetir canción' : state.loop === 'queue' ? 'Repetir cola' : label; break;
      case 'mp_voldown': disabled = (state.volume ?? 100) <= 0; break;
      case 'mp_stop': style = ButtonStyle.Danger; break;
      case 'mp_volup': disabled = (state.volume ?? 100) >= 200; break;
      case 'mp_autoplay': style = state.autoplay ? ButtonStyle.Success : style; break;
    }
    const id = applicationEmojiIds[key];
    const emoji = /^\d+$/.test(String(id ?? '')) ? { id: String(id), name: `obey_${key}`, animated: false } : fallback[key];
    const button = new ButtonBuilder().setCustomId(entry.customId).setLabel(label).setEmoji(emoji).setStyle(style).setDisabled(disabled);
    rows[entry.row - 1].addComponents(button);
  }
  return rows;
}
module.exports = { buildCharacterControls };
