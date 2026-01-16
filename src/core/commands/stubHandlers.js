function notImplemented (featureName) {
  const shown = String(featureName || 'Función').trim() || 'Función'
  return async (client, interaction) => {
    return interaction.reply({
      content: `ƒ?O ${shown}: en desarrollo. Si querés que lo priorice, decime el flujo exacto y reglas.`,
      ephemeral: true
    })
  }
}

module.exports = {
  notImplemented
}
