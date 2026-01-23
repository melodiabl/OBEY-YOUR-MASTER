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
      .setTitle(`${Emojis.system} ${Format.toBold('ESTADÍSTICAS TÉCNICAS')}`)
      .setColor('#2b2d31')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        {
          name: `${Emojis.stats} ${Format.toBold('SISTEMA')}`,
          value: [
            `${Emojis.dot} ${Format.toBold('OS:')} ${os.platform()} ${os.arch()}`,
            `${Emojis.dot} ${Format.toBold('CPU:')} ${os.cpus()[0].model.split('@')[0]}`,
            `${Emojis.dot} ${Format.toBold('RAM:')} ${ram}MB / ${totalRam}GB`
          ].join('\n'),
          inline: true
        },
        {
          name: `${Emojis.utility} ${Format.toBold('BOT')}`,
          value: [
            `${Emojis.dot} ${Format.toBold('Discord.js:')} v${version}`,
            `${Emojis.dot} ${Format.toBold('Node.js:')} ${process.version}`,
            `${Emojis.dot} ${Format.toBold('Ping:')} ${client.ws.ping}ms`
          ].join('\n'),
          inline: true
        },
        {
          name: `${Emojis.calendar} ${Format.toBold('UPTIME')}`,
          value: `${Format.toBold(`${days}`)}d ${Format.toBold(`${hours}`)}h ${Format.toBold(`${minutes}`)}m ${Format.toBold(`${seconds}`)}s`,
          inline: false
        }
      )
      .setFooter({ text: `OBEY YOUR MASTER | Infraestructura` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
