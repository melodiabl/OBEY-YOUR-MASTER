const { runPlaybackControl } = require("../../bot/modulos/musica/comandos/controlar")
module.exports = {
  name: 'skip', description: 'Salta la cancion actual',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [{ Integer: { name: 'cantidad', description: 'Cuantas canciones saltar (default 1)', required: false } }],
  run: (client, interaction) => runPlaybackControl(client, interaction, { action: 'skip', slash: true, count: interaction.options.getInteger('cantidad') ?? 1 }),
}
