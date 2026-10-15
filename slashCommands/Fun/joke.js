const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const https = require('https')

function fetchJoke() {
  return new Promise((resolve, reject) => {
    https.get('https://official-joke-api.appspot.com/random_joke', res => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve(JSON.parse(body)) } catch { reject(new Error('parse error')) }
      })
    }).on('error', reject)
  })
}

module.exports = {
  name: 'joke',
  description: obeyUi.owned('Obtén un chiste aleatorio 😂'),

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'FUN'))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ El sistema de diversión no está activado.'), 4096))],
        ephemeral: true,
      })

    await interaction.deferReply()

    try {
      const data = await fetchJoke()
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xF59E0B)
            .setTitle(obeyUi.limit(data.setup || obeyUi.owned('😂 Chiste'), 256))
            .setDescription(obeyUi.limit(data.punchline || '…', 4096))
            .setFooter(obeyMeta.asFooter({ text: `Tipo: ${data.type ?? 'general'}` })),
        ],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No se pudo obtener el chiste. Intenta de nuevo.'), 4096))],
      })
    }
  },
}
