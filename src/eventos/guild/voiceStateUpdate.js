const systems = require('../../systems')

module.exports = async (client, oldState, newState) => {
  try {
    await systems.voice.handleVoiceStateUpdate({ client, oldState, newState })
  } catch (e) {}
}

