const { ActivityType, PresenceUpdateStatus } = require('discord.js')
const { registerSlashCommands } = require('../../core/commands/registerSlashCommands')

module.exports = async client => {
  console.log(`Conectado como ${client.user.tag}`.rainbow)

  // Scheduler de sorteos (giveaways) con persistencia
  try {
    const { startGiveawayScheduler } = require('../../systems').giveaways
    startGiveawayScheduler(client)
  } catch (e) {}

  // Limpieza de canales temporales de voz (si quedaron huérfanos)
  try {
    const { cleanupOrphanTempChannels } = require('../../systems').voice
    cleanupOrphanTempChannels({ client }).catch(() => {})
  } catch (e) {}

  setInterval(() => pickPresence(client), 60 * 1000)
  try {
    const r = await registerSlashCommands(client)
    const global = r?.counts?.global || 0
    const guild = r?.counts?.guild || 0
    const overflow = r?.counts?.overflow || 0
    if (overflow > 0) {
      console.log(`(/) Publicados: global=${global} + guild=${guild}. Overflow ignorado=${overflow} (límites: 100 global + 100 guild).`.yellow)
    } else if (guild > 0) {
      console.log(`(/) Publicados: global=${global} + guild=${guild}.`.green)
    } else {
      console.log(`(/) Publicados: global=${global}.`.green)
    }
  } catch (e) {
    console.log(`(/) Error publicando comandos: ${e?.message || e}`.bgRed)
  }
}
async function pickPresence (client) {
  const options = [
    { type: ActivityType.Listening, text: '/panel', status: PresenceUpdateStatus.Online },
    { type: ActivityType.Watching, text: 'tu servidor', status: PresenceUpdateStatus.Online },
    { type: ActivityType.Playing, text: 'con /help', status: PresenceUpdateStatus.Idle }
  ]
  const option = Math.floor(Math.random() * options.length)
  await client.user.setPresence({
    activities: [{ name: options[option].text, type: options[option].type }],
    status: options[option].status
  })
}
