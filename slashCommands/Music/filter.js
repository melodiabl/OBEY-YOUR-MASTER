const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const { filterLabel } = require('../../handlers/music/filters')
module.exports = {
  name: 'filter',
  description: 'Aplica un filtro de audio a la musica',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [
    {
      StringChoices: {
        name: 'preset',
        description: 'Filtro a aplicar',
        required: true,
        choices: [
          { name: 'Bass Boost',  value: 'bassboost' },
          { name: 'Nightcore',   value: 'nightcore' },
          { name: '8D',          value: '8d'         },
          { name: 'Vaporwave',   value: 'vaporwave'  },
          { name: 'Lo-Fi',       value: 'lofi'       },
          { name: 'Slowed',      value: 'slowed'     },
          { name: 'Crystal',     value: 'crystal'    },
          { name: 'Metal',       value: 'metal'      },
          { name: 'Pop',         value: 'pop'        },
          { name: 'Soft',        value: 'soft'       },
          { name: 'Tremolo',     value: 'tremolo'    },
          { name: 'Vibrato',     value: 'vibrato'    },
          { name: 'Karaoke',     value: 'karaoke'    },
          { name: 'Normalizar volumen', value: 'normalizar' },
          { name: 'Eco',         value: 'eco'        },
          { name: 'Radio FM',    value: 'radio'      },
          { name: 'Sin filtro',  value: 'off'        },
        ],
      },
    },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(obeyUi.limit(d, 4096))

    const voiceChannel = interaction.member?.voice?.channel
    if (!voiceChannel) return interaction.reply({ embeds: [err(obeyUi.owned('❌ Debes estar en un canal de voz.'))], ephemeral: true })
    if (!client.music) return interaction.reply({ embeds: [err(obeyUi.owned('❌ Sistema de música no disponible.'))], ephemeral: true })

    const state = client.music.getState(interaction.guild.id)
    if (!state.currentTrack) return interaction.reply({ embeds: [err(obeyUi.owned('❌ No hay música reproduciéndose.'))], ephemeral: true })

    const preset = interaction.options.getString('preset')
    await interaction.deferReply()
    try {
      await client.music.setFilter(interaction.guild.id, preset)
      const label = filterLabel(preset) || preset
      await interaction.editReply({ embeds: [ok(preset === 'off' ? `${obeyUi.markup("icon.music")} Filtro **desactivado**` : `${obeyUi.markup("icon.settings")} Filtro aplicado: **${label}**`)] })
    } catch (e) {
      await interaction.editReply({ embeds: [err(`${obeyUi.markup("icon.error")} ${e.message || e}`)] })
    }
  },
}
