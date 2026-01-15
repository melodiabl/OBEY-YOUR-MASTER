const { EmbedBuilder } = require('discord.js');
const GuildSchema = require('../../database/schemas/GuildSchema');

module.exports = async (client, message) => {
  if (!message.guild || message.author?.bot) return;

  const guildData = await GuildSchema.findOne({ guildID: message.guild.id });
  if (!guildData || !guildData.logsChannel) return;

  const channel = message.guild.channels.cache.get(guildData.logsChannel);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Mensaje Eliminado')
    .setColor('Red')
    .addFields(
      { name: 'Autor', value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: 'Canal', value: `${message.channel}`, inline: true },
      { name: 'Contenido', value: message.content || '*Sin contenido (posiblemente un embed o imagen)*' }
    )
    .setTimestamp();

  channel.send({ embeds: [embed] }).catch(() => {});
};
