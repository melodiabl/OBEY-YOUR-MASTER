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
    const r = await registerSlashCommands(client, { paceMs: 0 })
    if (r?.counts?.dropped > 0) {
      console.log(`(/) Publicados: global=${r.counts.global}, guildOverflow=${r.counts.overflow}. Ignorados=${r.counts.dropped} (límite Discord: 200 total por guild).`.yellow)
    } else if (r?.counts?.overflow > 0) {
      console.log(`(/) Publicados: global=${r.counts.global}, guildOverflow=${r.counts.overflow}.`.green)
    } else {
      console.log(`(/) ${client.slashCommands.size} Comandos Publicados!`.green)
    }
  } catch (e) {
    console.log(`(/) Error publicando comandos: ${e?.message || e}`.bgRed)
  }
}

async function pickPresence (client) {
  const options = [
    {
      type: ActivityType.Watching,
      text: 'over Fusion Empire',
      status: PresenceUpdateStatus.Online
    },
    {
      type: ActivityType.Playing,
      text: 'with Discord.js',
      status: PresenceUpdateStatus.DoNotDisturb
    },
    {
      type: ActivityType.Listening,
      text: 'for commands',
      status: PresenceUpdateStatus.Idle
    }
  ]
  const option = Math.floor(Math.random() * options.length)
  await client.user.setPresence({
    activities: [
      {
        name: options[option].text,
        type: options[option].type
      }
    ],
    status: options[option].status
  })
}

/* const twitchAlert = () => {
  setInterval(async function () {
    const user = 'USERNAME'

    const uptime = await globalThis.fetch(`https://decapi.me/twitch/uptime/${user}`)

    const avatar = await globalThis.fetch(`https://decapi.me/twitch/avatar/${user}`)

    const viewers = await globalThis.fetch(`https://decapi.me/twitch/viewercount/${user}`)

    const title = await globalThis.fetch(`https://decapi.me/twitch/title/${user}`)

    const game = await globalThis.fetch(`https://decapi.me/twitch/game/${user}`)

    const twitch = require('./Schemas/twitchSchema')

    const data = await twitch.findOne({ user, titulo: title.body })

    if (uptime.body !== `${user} is offline`) {
      const TwitchEmbed = new Discord.MessageEmbed()
        .setAuthor({ name: `${user}`, iconURL: `${avatar.body}` })
        .setTitle(`${title.body}`)
        .setThumbnail(`${avatar.body}`)
        .setURL(`https://www.twitch.tv/${user}`)
        .AddField('Game', `${game.body}`, true)
        .addField('Viewers', `${viewers.body}`, true)
        .setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${user}-620x378.jpg`)
        .setColor('BLURPLE')

      if (!data) {
        const newdata = new twitch({
          user,
          titulo: `${title.body}`
        })

        await client.channels.cache.get('id de un canl').send({ content: `пY"О @everyone ${user} estгґ en directo. __**ІґCorre a verlo!**__ пY"О\n\nhttps://www.twitch.tv/${user}`, embeds: [TwitchEmbed] })

        return await newdata.save()
      }

      if (data.titulo === `${title.body}`) return

      await client.channels.cache.get('id del mismo canal').send({ content: `пY"О @everyone ${user} estгґ en directo. __**ІґCorre a verlo!**__ пY"О\n\nhttps://www.twitch.tv/${user}`, embeds: [TwitchEmbed] })

      await twitch.findOneAndUpdate({ user }, { titulo: title.body })
    }
  }, 120000)
} */
