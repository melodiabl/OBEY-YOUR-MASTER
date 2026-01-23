const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const { replyWarn } = require('../../core/ui/interactionKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Ejecuta código remoto (solo OWNER)')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('Código a ejecutar')
        .setRequired(true)
    ),
  OWNER: true,
  async execute (client, interaction) {
    return replyWarn(client, interaction, {
      system: 'security',
      title: 'Eval deshabilitado',
      lines: [
        `${Emojis.dot} Eval remoto está deshabilitado por seguridad.`,
        `${Emojis.dot} Si querés habilitarlo: whitelist estricta + auditoría + sandbox.`
      ],
      signature: 'Seguridad primero'
    }, { ephemeral: true })
  }
}

