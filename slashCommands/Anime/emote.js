const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
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
  baka:      (s, t) => `**${s}** llama baka a **${t ?? 'alguien'}** ${obeyUi.markup("icon.face-angry")}`,
  bite:      (s, t) => `**${s}** muerde a **${t ?? 'alguien'}** ${obeyUi.markup("icon.tooth")}`,
  blush:     (s)    => `**${s}** se está ruborizando ${obeyUi.markup("icon.face-surprise")}`,
  bonk:      (s, t) => `**${s}** le da un bonk a **${t ?? 'alguien'}** ${obeyUi.markup("icon.gavel")}`,
  bored:     (s)    => `**${s}** está aburrido/a ${obeyUi.markup("icon.face-neutral")}`,
  bully:     (s, t) => `**${s}** molesta a **${t ?? 'alguien'}** ${obeyUi.markup("icon.face-angry")}`,
  confused:  (s)    => `**${s}** está confundido/a ${obeyUi.markup("icon.face-sad")}`,
  cry:       (s)    => `**${s}** está llorando ${obeyUi.markup("icon.face-cry")}`,
  cuddle:    (s, t) => `**${s}** acurruca a **${t ?? 'alguien'}** ${obeyUi.markup("icon.face-smile")}`,
  dance:     (s)    => `**${s}** está bailando ${obeyUi.markup("icon.dance")}`,
  goodnight: (s, t) => `**${s}** le da las buenas noches a **${t ?? 'todos'}** ${obeyUi.markup("icon.moon")}`,
  happy:     (s)    => `**${s}** está muy feliz ${obeyUi.markup("icon.face-smile")}`,
  highfive:  (s, t) => `**${s}** le da un high-five a **${t ?? 'alguien'}** ${obeyUi.markup("icon.hand")}`,
  hug:       (s, t) => `**${s}** abraza a **${t ?? 'alguien'}** ${obeyUi.markup("icon.hand")}`,
  kick:      (s, t) => `**${s}** le da una patada a **${t ?? 'alguien'}** ${obeyUi.markup("icon.hand")}`,
  kill:      (s, t) => `**${s}** intenta matar a **${t ?? 'alguien'}** ${obeyUi.markup("icon.swords")}`,
  kiss:      (s, t) => `**${s}** besa a **${t ?? 'alguien'}** ${obeyUi.markup("icon.kiss")}`,
  nervous:   (s)    => `**${s}** está nervioso/a ${obeyUi.markup("icon.face-cry")}`,
  pat:       (s, t) => `**${s}** le da palmaditas a **${t ?? 'alguien'}** ${obeyUi.markup("icon.hand")}`,
  poke:      (s, t) => `**${s}** le da un codazo a **${t ?? 'alguien'}` + obeyUi.owned('👉'),
  punch:     (s, t) => `**${s}** le pega un puñetazo a **${t ?? 'alguien'}** ${obeyUi.markup("icon.hand")}`,
  sad:       (s)    => `**${s}** está triste ${obeyUi.markup("icon.face-sad")}`,
  scream:    (s)    => `**${s}** está gritando ${obeyUi.markup("icon.face-surprise")}`,
  slap:      (s, t) => `**${s}** le da una bofetada a **${t ?? 'alguien'}** ${obeyUi.markup("icon.hand")}`,
  smile:     (s)    => `**${s}** está sonriendo ${obeyUi.markup("icon.face-smile")}`,
  stare:     (s, t) => `**${s}** mira fijamente a **${t ?? 'alguien'}** ${obeyUi.markup("icon.eye")}`,
  thinking:  (s)    => `**${s}** está pensando ${obeyUi.markup("icon.face-thinking")}`,
  wave:      (s, t) => `**${s}** saluda a **${t ?? 'todos'}** ${obeyUi.markup("icon.hand")}`,
  wink:      (s, t) => `**${s}** le guiña el ojo a **${t ?? 'alguien'}** ${obeyUi.markup("icon.face-wink")}`,
  yeet:      (s, t) => `**${s}** yeetea a **${t ?? 'alguien'}** ${obeyUi.markup("icon.boost")}`,
  yes:       (s)    => `**${s}** dice que sí ${obeyUi.markup("icon.vote-up")}`,
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
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ El sistema anime no está activado.'), 4096))],
        ephemeral: true,
      })

    const emote   = interaction.options.getString('emocion')
    const target  = interaction.options.getUser('usuario')
    const sender  = interaction.user

    if (!EMOTIONS.includes(emote))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Emoción no reconocida. Usa el autocompletado.'), 4096))],
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
            .setDescription(obeyUi.limit(desc, 4096))
            .setImage(gifUrl)
            .setFooter(obeyMeta.asFooter({ text: `${sender.username} • anime-emotions` })),
        ],
      })
    } catch {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No se pudo obtener el GIF. Intenta de nuevo.'), 4096))],
      })
    }
  },
}
