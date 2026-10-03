async function executeSlashCommand(interaction, run) {
  try {
    return await run()
  } catch (error) {
    console.error('[Slash] Error al ejecutar comando:', error)
    const response = {
      content: '❌ Ocurrió un error al ejecutar el comando.',
      embeds: [],
      components: [],
    }
    try {
      if (interaction.deferred) await interaction.editReply(response)
      else if (interaction.replied) await interaction.followUp({ ...response, ephemeral: true })
      else await interaction.reply({ ...response, ephemeral: true })
    } catch (replyError) {
      console.error('[Slash] No se pudo responder al error:', replyError)
    }
  }
}

module.exports = { executeSlashCommand }
