const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js')

module.exports = {
  name: 'join',
  category: '🎶 Music',
  aliases: ['summon', 'conectar'],
  description: 'Me une a tu canal de voz',
  usage: 'join',
  parameters: { type: 'music', activeplayer: false, previoussong: false, notsamechannel: true },

  run: async (client, message) => {
    const es = client.settings.get(message.guild.id, 'embed')
    const ls = client.settings.get(message.guild.id, 'language')

    if (!client.settings.get(message.guild.id, 'MUSIC')) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setTitle(client.la[ls].common.disabled.title)] })
    }

    const userVC = message.member?.voice?.channel
    if (!userVC) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setTitle('❌ Debes estar en un canal de voz primero.')] })
    }

    const perms = userVC.permissionsFor(client.user)
    if (!perms.has(PermissionFlagsBits.Connect) || !perms.has(PermissionFlagsBits.Speak)) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setTitle(`❌ No tengo permisos para unirme a ${userVC.name}.`)] })
    }

    const botVC    = message.guild.members.me.voice.channel
    const state    = client.music?.getState(message.guild.id)
    const vcId     = state?.voiceChannelId || botVC?.id

    // ── Estado 1: ya estoy en el mismo canal que el usuario ─────────────────
    if (vcId && vcId === userVC.id) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(es.color)
            .setTitle('🎙️ Ya estoy en tu canal')
            .setDescription(`Ya estoy conectado en <#${userVC.id}>.`),
        ],
      })
    }

    // ── Estado 2: estoy en un canal diferente → preguntar si mover ──────────
    if (vcId && vcId !== userVC.id) {
      const reply = await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFEE75C)
            .setTitle('⚠️ Ya estoy en otro canal')
            .setDescription(`Estoy conectado en <#${vcId}>.\n¿Quieres moverme a <#${userVC.id}>?`),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('join_move').setLabel('Moverme').setStyle(ButtonStyle.Primary).setEmoji('🔀'),
            new ButtonBuilder().setCustomId('join_cancel').setLabel('Cancelar').setStyle(ButtonStyle.Secondary).setEmoji('✖️'),
          ),
        ],
      })

      const collector = reply.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id,
        time:   20_000,
        max:    1,
      })

      collector.on('collect', async i => {
        await i.deferUpdate()
        if (i.customId === 'join_cancel') {
          return reply.edit({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('🚫 Cancelado.')], components: [] })
        }
        // Mover al nuevo canal
        try {
          await client.shoukaku?.leaveVoiceChannel(message.guild.id)
          await new Promise(r => setTimeout(r, 400))
          const player = await client.music?.joinChannel(message.guild.id, userVC.id, message.channel.id)
          if (player) {
            await reply.edit({
              embeds: [
                new EmbedBuilder()
                  .setColor(es.color)
                  .setTitle('<a:yes:833101995723194437> ¡Me moví a tu canal!')
                  .setDescription(`Ahora estoy conectado en <#${userVC.id}>.`),
              ],
              components: [],
            })
          } else {
            await reply.edit({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setDescription('❌ No pude moverme al canal.')], components: [] })
          }
        } catch (e) {
          await reply.edit({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setDescription(`❌ ${e.message || e}`)], components: [] })
        }
      })

      collector.on('end', (collected, reason) => {
        if (reason === 'time' && !collected.size) {
          reply.edit({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('⏱ Expirado.')], components: [] }).catch(() => {})
        }
      })

      return
    }

    // ── Estado 3: no estoy en ningún canal → unirse ──────────────────────────
    try {
      const player = await client.music?.joinChannel(message.guild.id, userVC.id, message.channel.id)
      if (player) {
        await message.react('🎙').catch(() => {})
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(es.color)
              .setTitle('<a:yes:833101995723194437> ¡Me uní a tu canal!')
              .setDescription(`Conectado en <#${userVC.id}>.`),
          ],
        })
      }
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setDescription('❌ No pude unirme al canal.')] })
    } catch (e) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setDescription(`❌ ${e.message || e}`)] })
    }
  },
}
