const { EmbedBuilder } = require('discord.js')
const https = require('https')

function fetchFact() {
  return new Promise((resolve, reject) => {
    https.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en', res => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve(JSON.parse(body)) } catch { reject(new Error('parse error')) }
      })
    }).on('error', reject)
  })
}

module.exports = {
  name: 'fact',
  description: 'Obtén un dato curioso aleatorio 📚',

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'FUN'))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ El sistema de diversión no está activado.')],
        ephemeral: true,
      })

    await interaction.deferReply()

    try {
      const data = await fetchFact()
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x3B82F6)
            .setTitle('📯 Dato Curioso')
            .setDescription(`> *${data.text || 'Sin dato disponible'}*`)
            .setFooter({ text: 'uselessfacts.jsph.pl' }),
        ],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No se pudo obtener el dato. Intenta de nuevo.')],
      })
    }
  },
}
