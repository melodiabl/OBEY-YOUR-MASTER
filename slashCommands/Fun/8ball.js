const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const https = require('https')

function fetch8ball(question) {
  return new Promise((resolve, reject) => {
    const q = encodeURIComponent(question)
    https.get(`https://8ball.delegator.com/magic/JSON/${q}`, res => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve(JSON.parse(body)) } catch { reject(new Error('parse error')) }
      })
    }).on('error', reject)
  })
}

const TYPE_COLOR = { Affirmative: 0x22C55E, Contrary: 0xED4245, Neutral: 0x71717A }

module.exports = {
  name: '8ball',
  description: obeyUi.owned('Pregúntale algo a la bola mágica 🎱'),
  options: [
    { String: { name: 'pregunta', description: '¿Qué quieres preguntarle?', required: true } },
  ],

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'FUN'))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ El sistema de diversión no está activado.'), 4096))],
        ephemeral: true,
      })

    const question = interaction.options.getString('pregunta')
    await interaction.deferReply()

    try {
      const data  = await fetch8ball(question)
      const magic = data?.magic
      const color = TYPE_COLOR[magic?.type] ?? 0x5865F2

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(color)
            .setTitle(obeyUi.limit(obeyUi.owned('🎱 Bola Mágica 8'), 256))
            .addFields(
              { name: obeyUi.owned('❓ Pregunta'),   value: question,         inline: false },
              { name: obeyUi.owned('🔮 Respuesta'), value: magic?.answer ?? '…', inline: false },
            )
            .setFooter(obeyMeta.asFooter({ text: `Preguntado por ${interaction.user.username}` })),
        ],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No se pudo contactar la bola mágica. Intenta de nuevo.'), 4096))],
      })
    }
  },
}
