const { randomUUID, randomInt } = require('node:crypto')
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const active = new Set()
const prompts = {
  WouldYouRather: [
    ['¿Qué preferís?', 'Viajar al pasado', 'Viajar al futuro'],
    ['¿Qué preferís?', 'Vivir junto al mar', 'Vivir en la montaña'],
    ['¿Qué preferís?', 'Aprender cualquier idioma', 'Tocar cualquier instrumento'],
    ['¿Qué preferís?', 'Explorar el espacio', 'Explorar el océano'],
    ['¿Qué preferís?', 'Un concierto enorme', 'Un concierto privado'],
  ],
  WillYouPressTheButton: [
    ['Podés teletransportarte, pero siempre llegás cinco minutos tarde. ¿Pulsás el botón?', 'Sí', 'No'],
    ['Podés volar, pero solo cuando llueve. ¿Pulsás el botón?', 'Sí', 'No'],
    ['Nunca necesitás dormir, pero no podés soñar. ¿Pulsás el botón?', 'Sí', 'No'],
    ['Entendés a todos los animales, pero ellos te piden favores. ¿Pulsás el botón?', 'Sí', 'No'],
    ['Tenés entradas para todos los conciertos, pero siempre en la última fila. ¿Pulsás el botón?', 'Sí', 'No'],
  ],
  NeverHaveIEver: [
    ['Yo nunca… me quedé dormido viendo una película.', 'Lo hice', 'Nunca'],
    ['Yo nunca… canté sin saber la letra.', 'Lo hice', 'Nunca'],
    ['Yo nunca… envié un mensaje al chat equivocado.', 'Lo hice', 'Nunca'],
    ['Yo nunca… perdí las llaves estando en casa.', 'Lo hice', 'Nunca'],
    ['Yo nunca… terminé un videojuego en una sola sesión.', 'Lo hice', 'Nunca'],
  ],
}

async function choice(name, options) {
  const message = options.message
  const key = `${message.guild.id}:${message.author.id}`
  if (active.has(key)) return message.reply('Ya tenés una partida activa. Terminála primero.')
  active.add(key)
  try {
    const prompt = prompts[name][randomInt(prompts[name].length)]
    const id = randomUUID()
    const buttons = prompt.slice(1).map((label, index) => new ButtonBuilder().setCustomId(`${id}:${index}`).setLabel(label).setStyle(ButtonStyle.Primary))
    const row = () => new ActionRowBuilder().addComponents(buttons)
    const embed = new EmbedBuilder().setColor(options.embed.color).setTitle(options.embed.title).setDescription(prompt[0])
    const sent = await message.reply({ embeds: [embed], components: [row()] })
    let answered = false
    const collector = sent.createMessageComponentCollector({ time: Math.min(options.time || 60000, 120000) })
    collector.on('collect', async interaction => {
      try {
        if (interaction.user.id !== message.author.id) return await interaction.reply({ content: 'Esta partida pertenece a otra persona.', ephemeral: true })
        const index = buttons.findIndex(button => button.data.custom_id === interaction.customId)
        if (index < 0 || answered || collector.ended) return
        answered = true
        buttons.forEach(button => button.setDisabled(true))
        embed.setDescription(`${prompt[0]}\n\nElegiste: **${prompt[index + 1]}**`)
        await interaction.update({ embeds: [embed], components: [row()] })
        collector.stop('answered')
      } catch (error) { console.warn('[Games] Choice update:', error.message); collector.stop('error') }
    })
    collector.on('end', async (_, reason) => {
      active.delete(key)
      if (reason === 'answered') return
      buttons.forEach(button => button.setDisabled(true))
      embed.setFooter({ text: 'Partida finalizada' })
      await sent.edit({ embeds: [embed], components: [row()] }).catch(error => console.warn('[Games] Choice cleanup:', error.message))
    })
    return sent
  } catch (error) { active.delete(key); throw error }
}
module.exports = { choice, prompts }
