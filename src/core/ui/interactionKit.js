const { getGuildUiConfig, safeReply, embed, okEmbed, warnEmbed, infoEmbed, errorEmbed } = require('./uiKit')

async function replyEmbed (client, interaction, options, { ephemeral } = {}) {
  const ui = await getGuildUiConfig(client, interaction.guild.id)
  const e = embed({ ui, ...options })
  return safeReply(interaction, { embeds: [e], ephemeral: Boolean(ephemeral) })
}

async function replyOk (client, interaction, options, { ephemeral } = {}) {
  const ui = await getGuildUiConfig(client, interaction.guild.id)
  const e = okEmbed({ ui, ...options })
  return safeReply(interaction, { embeds: [e], ephemeral: Boolean(ephemeral) })
}

async function replyWarn (client, interaction, options, { ephemeral } = {}) {
  const ui = await getGuildUiConfig(client, interaction.guild.id)
  const e = warnEmbed({ ui, ...options })
  return safeReply(interaction, { embeds: [e], ephemeral: Boolean(ephemeral) })
}

async function replyInfo (client, interaction, options, { ephemeral } = {}) {
  const ui = await getGuildUiConfig(client, interaction.guild.id)
  const e = infoEmbed({ ui, ...options })
  return safeReply(interaction, { embeds: [e], ephemeral: Boolean(ephemeral) })
}

async function replyError (client, interaction, options, { ephemeral } = {}) {
  const ui = await getGuildUiConfig(client, interaction.guild.id)
  const e = errorEmbed({ ui, ...options })
  return safeReply(interaction, { embeds: [e], ephemeral: Boolean(ephemeral) })
}

module.exports = {
  replyEmbed,
  replyOk,
  replyWarn,
  replyInfo,
  replyError
}
