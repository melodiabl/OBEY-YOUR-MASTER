const { EmbedBuilder } = require('discord.js')
module.exports = ({ name, aliases, key, label }) => ({
  name, aliases, category: '⚙️ Settings', description: label,
  memberpermissions: ['Administrator'], usage: `${name} <comando>`,
  run: async (client, message, args) => {
    const input = String(args[0] || '').toLowerCase()
    const target = client.commands.get(input) || client.commands.get(client.aliases.get(input))
    if (!target || target.parameters?.type !== 'music') return message.reply('❌ Indica un comando de música válido.')
    const guildId = message.guild.id
    const current = client.settings.get(guildId, key) || []
    const enabled = !current.includes(target.name)
    client.settings.set(guildId, enabled ? [...current, target.name] : current.filter(value => value !== target.name), key)
    await client.settings.flush?.()
    return message.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setDescription(`**${target.name}**: ${label} ${enabled ? 'activado' : 'desactivado'}.`)] })
  },
})
