const { EmbedBuilder } = require('discord.js')
const anime = require('anime-actions')

const EMOTIONS = [
  'agree','baka','bite','blush','bonk','bored','bully','confused','cry','cuddle',
  'dance','goodnight','happy','highfive','hug','kick','kill','kiss','nervous',
  'pat','poke','punch','sad','scream','slap','smile','stare','thinking',
  'wave','wink','yeet','yes',
]

// Map emotion → descriptive message (subject [verb] object)
const MSG = {
  agree:     (s, t) => `**${s}** está de acuerdo con **${t ?? 'todos'}**`,
  baka:      (s, t) => `**${s}** llama baka a **${t ?? 'alguien'}** 😤`,
  bite:      (s, t) => `**${s}** muerde a **${t ?? 'alguien'}** 🦷`,
  blush:     (s)    => `**${s}** se está ruborizando 😳`,
  bonk:      (s, t) => `**${s}** le da un bonk a **${t ?? 'alguien'}** 🔨`,
  bored:     (s)    => `**${s}** está aburrido/a 😒`,
  bully:     (s, t) => `**${s}** molesta a **${t ?? 'alguien'}** 😈`,
  confused:  (s)    => `**${s}** está confundido/a 😕`,
  cry:       (s)    => `**${s}** está llorando 😢`,
  cuddle:    (s, t) => `**${s}** acurruca a **${t ?? 'alguien'}** 🥰`,
  dance:     (s)    => `**${s}** está bailando 🕺`,
  goodnight: (s, t) => `**${s}** le da las buenas noches a **${t ?? 'todos'}** 🌙`,
  happy:     (s)    => `**${s}** está muy feliz 😊`,
  highfive:  (s, t) => `**${s}** le da un high-five a **${t ?? 'alguien'}** 🙌`,
  hug:       (s, t) => `**${s}** abraza a **${t ?? 'alguien'}** 🤗`,
  kick:      (s, t) => `**${s}** le da una patada a **${t ?? 'alguien'}** 🦵`,
  kill:      (s, t) => `**${s}** intenta matar a **${t ?? 'alguien'}** ⚔️`,
  kiss:      (s, t) => `**${s}** besa a **${t ?? 'alguien'}** 💋`,
  nervous:   (s)    => `**${s}** está nervioso/a 😰`,
  pat:       (s, t) => `**${s}** le da palmaditas a **${t ?? 'alguien'}** 🤗`,
  poke:      (s, t) => `**${s}** le da un codazo a **${t ?? 'alguien'}` + '👉',
  punch:     (s, t) => `**${s}** le pega un puñetazo a **${t ?? 'alguien'}** 👊`,
  sad:       (s)    => `**${s}** está triste 😔`,
  scream:    (s)    => `**${s}** está gritando 😱`,
  slap:      (s, t) => `**${s}** le da una bofetada a **${t ?? 'alguien'}** 👋`,
  smile:     (s)    => `**${s}** está sonriendo 😊`,
  stare:     (s, t) => `**${s}** mira fijamente a **${t ?? 'alguien'}** 👀`,
  thinking:  (s)    => `**${s}** está pensando 🤔`,
  wave:      (s, t) => `**${s}** saluda a **${t ?? 'todos'}** 👋`,
  wink:      (s, t) => `**${s}** le guiña el ojo a **${t ?? 'alguien'}** 😉`,
  yeet:      (s, t) => `**${s}** yeetea a **${t ?? 'alguien'}** 🚀`,
  yes:       (s)    => `**${s}** dice que sí 👍`,
}

module.exports = {
  name: 'emote',
  description: 'Expresa una emoción anime con un GIF',
  options: [
    {
      StringAutocomplete: {
        name: 'emocion',
        description: 'Emoción a expresar (escribe para filtrar)',
        required: true,
      },
    },
    {
      User: {
        name: 'usuario',
        description: 'Usuario al que va dirigida la emoción (opcional)',
        required: false,
      },
    },
  ],

  autocomplete: async (client, interaction) => {
    const focused = interaction.options.getFocused().toLowerCase()
    const choices = EMOTIONS
      .filter(e => e.includes(focused))
      .slice(0, 25)
      .map(e => ({ name: e, value: e }))
    await interaction.respond(choices).catch(() => {})
  },

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'ANIME'))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ El sistema anime no está activado.')],
        ephemeral: true,
      })

    const emote   = interaction.options.getString('emocion')
    const target  = interaction.options.getUser('usuario')
    const sender  = interaction.user

    if (!EMOTIONS.includes(emote))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Emoción no reconocida. Usa el autocompletado.')],
        ephemeral: true,
      })

    await interaction.deferReply()

    try {
      const gifUrl = await anime[emote]()
      const desc = (MSG[emote] || ((s) => `**${s}** hace *${emote}*`))(
        sender.username,
        target?.username ?? null,
      )

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(desc)
            .setImage(gifUrl)
            .setFooter({ text: `${sender.username} • anime-emotions` }),
        ],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No se pudo obtener el GIF. Intenta de nuevo.')],
      })
    }
  },
}
