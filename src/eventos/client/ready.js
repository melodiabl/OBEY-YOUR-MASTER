const { ActivityType, PresenceUpdateStatus } = require('discord.js')
const { registerSlashCommands } = require('../../core/commands/registerSlashCommands')

module.exports = async client => {
  console.log(`Conectado como ${client.user.tag}`.rainbow)

  // Scheduler de sorteos (giveaways) con persistencia
  try {
    const { startGiveawayScheduler } = require('../../systems').giveaways
    startGiveawayScheduler(client)
  } catch (e) {}

  setInterval(() => pickPresence(client), 60 * 1000)
  try {
    const r = await registerSlashCommands(client)
    if (r?.counts?.dropped > 0) {
      console.log(`(/) Publicados: global=${r.counts.global}. Ignorados=${r.counts.dropped} (límite Discord: 100 comandos globales).`.yellow)
    } else {
      console.log(`(/) Publicados: global=${r.counts.global}.`.green)
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

