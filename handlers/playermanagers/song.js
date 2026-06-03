const { EmbedBuilder } = require('discord.js')
const ee = require(`${process.cwd()}/botconfig/embed.json`)
const config = require(`${process.cwd()}/botconfig/config.json`)

function formatMs(ms) {
    if (!ms || ms <= 0) return '∞'
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    if (h > 0) return `${h}:${String(m % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
    return `${m}:${String(s % 60).padStart(2,'0')}`
}

async function song(client, message, args, type, slashCommand) {
    const isSlash = !!slashCommand
    const respond = isSlash ? slashCommand : message
    const ls = client.settings?.get(message.guild.id, 'language') || 'es'

    function sendEmbed(embed, ephemeral = false) {
        if (isSlash) {
            if (respond.deferred || respond.replied) return respond.editReply({ embeds: [embed] }).catch(() => {})
            return respond.reply({ embeds: [embed], ephemeral }).catch(() => {})
        }
        return message.reply({ embeds: [embed] }).catch(() => {})
    }

    const voiceChannel = message.member?.voice?.channel
    if (!voiceChannel)
        return sendEmbed(new EmbedBuilder().setColor(ee.wrongcolor).setTitle('❌ Debes estar en un canal de voz.'), true)

    if (!client.music)
        return sendEmbed(new EmbedBuilder().setColor(ee.wrongcolor).setTitle('❌ Sistema de música no disponible.'), true)

    const query = args.join(' ')
    if (!query)
        return sendEmbed(new EmbedBuilder().setColor(ee.wrongcolor).setTitle('❌ Ingresa el nombre o URL de la canción.'), true)

    try {
        const result = await client.music.play(
            message.guild.id,
            voiceChannel.id,
            message.channel.id,
            query,
            message.author
        )

        if (!result)
            return sendEmbed(new EmbedBuilder().setColor(ee.wrongcolor)
                .setTitle(`❌ No se encontró nada para: \`${query}\``), true)

        const { result: searchResult, state } = result
        const isPlaylist = searchResult.loadType === 'playlist'
        const track = searchResult.tracks[0]

        if (isPlaylist) {
            // Embed de playlist añadida
            const totalMs = searchResult.tracks.reduce((a, t) => a + (t.info?.length || 0), 0)
            const embed = new EmbedBuilder()
                .setColor(ee.color)
                .setTitle(`📋 Lista de reproducción añadida`)
                .setDescription(`**[${searchResult.playlistName || query}](${track?.info?.uri || ''})**`)
                .setThumbnail(track?.info?.artworkUrl || null)
                .addFields(
                    { name: '🎵 Canciones', value: `\`${searchResult.tracks.length}\``, inline: true },
                    { name: '⌛ Duración total', value: `\`${formatMs(totalMs)}\``, inline: true },
                    { name: '🔂 En cola', value: `\`${state.queue.length} canciones\``, inline: true },
                )
                .setFooter({ text: `Pedido por: ${message.author.tag}` })
            return sendEmbed(embed)
        }

        if (!track)
            return sendEmbed(new EmbedBuilder().setColor(ee.wrongcolor)
                .setTitle(`❌ No se encontró nada para: \`${query}\``), true)

        const isQueued = state.queue.length > 1

        const embed = new EmbedBuilder()
            .setColor(ee.color)
            .setTitle(isQueued ? '👍 Añadido a la cola 🎵' : '🎵 Reproduciendo ahora')
            .setDescription(`**[${track.info?.title || query}](${track.info?.uri || ''})**`)
            .setThumbnail(
                track.info?.artworkUrl ||
                (track.info?.identifier ? `https://img.youtube.com/vi/${track.info.identifier}/mqdefault.jpg` : null)
            )
            .addFields(
                { name: '⌛ Duración', value: `\`${track.info?.isStream ? 'EN VIVO' : formatMs(track.info?.length)}\``, inline: true },
                { name: '💿 Por', value: `\`${track.info?.author || 'Desconocido'}\``, inline: true },
                { name: '🔂 En cola', value: `\`${state.queue.length} canciones\``, inline: true },
            )
            .setFooter({ text: `Pedido por: ${message.author.tag}` })

        return sendEmbed(embed)

    } catch (e) {
        return sendEmbed(new EmbedBuilder().setColor(ee.wrongcolor)
            .setTitle(`❌ Error al reproducir`)
            .setDescription(`\`${e?.message || String(e)}\``), true)
    }
}

module.exports = song
