const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js')
const os = require('os')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('botstats')
    .setDescription('Muestra las estadísticas técnicas del bot'),
  async execute (client, interaction) {
    const uptime = process.uptime()
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor(uptime / 3600) % 24
    const minutes = Math.floor(uptime / 60) % 60
    const seconds = Math.floor(uptime % 60)

    const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2)
    
    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.system} Estadísticas de OBEY YOUR MASTER`)
      .setColor('DarkBlue')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        {
          name: `${Emojis.stats} Sistema`,
          value: [
            `${Emojis.dot} ${Format.bold('OS:')} ${os.platform()} ${os.arch()}`,
            `${Emojis.dot} ${Format.bold('CPU:')} ${os.cpus()[0].model}`,
            `${Emojis.dot} ${Format.bold('RAM:')} ${ram}MB / ${totalRam}GB`
          ].join('\n'),
          inline: false
        },
        {
          name: `${Emojis.utility} Bot`,
          value: [
            `${Emojis.dot} ${Format.bold('Uptime:')} ${days}d ${hours}h ${minutes}m ${seconds}s`,
            `${Emojis.dot} ${Format.bold('Discord.js:')} v${version}`,
            `${Emojis.dot} ${Format.bold('Node.js:')} ${process.version}`,
            `${Emojis.dot} ${Format.bold('Ping:')} ${client.ws.ping}ms`
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: `OBEY YOUR MASTER | Infraestructura` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
