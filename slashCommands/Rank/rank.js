const { EmbedBuilder, AttachmentBuilder } = require('discord.js')
const Canvas = require('@napi-rs/canvas')
const { clipRounded } = require('../../handlers/canvasUtils')

try {
  Canvas.GlobalFonts.registerFromPath('./assets/fonts/DMSans-Bold.ttf',    'DM Sans')
  Canvas.GlobalFonts.registerFromPath('./assets/fonts/DMSans-Regular.ttf', 'DM Sans')
  Canvas.GlobalFonts.registerFromPath('./assets/fonts/Genta.ttf',          'Genta')
} catch {}

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n ?? 0)
}

async function buildRankCard(user, member, data, rank) {
  const W = 900, H = 280
  const canvas = Canvas.createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  // fondo
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0f0f1a')
  bg.addColorStop(1, '#1a1a2e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // accent bar izquierda
  ctx.fillStyle = '#5865F2'
  ctx.fillRect(0, 0, 6, H)

  // avatar circular
  const AX = 50, AY = H / 2, AR = 70
  try {
    const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 })
    const img = await Canvas.loadImage(avatarURL)
    ctx.save()
    ctx.beginPath()
    ctx.arc(AX + AR, AY, AR, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img, AX, AY - AR, AR * 2, AR * 2)
    ctx.restore()
  } catch {}

  // anillo avatar
  ctx.strokeStyle = '#5865F2'
  ctx.lineWidth   = 4
  ctx.beginPath()
  ctx.arc(AX + AR, AY, AR + 3, 0, Math.PI * 2)
  ctx.stroke()

  // nombre
  const TX = AX + AR * 2 + 30
  ctx.fillStyle = '#ffffff'
  ctx.font      = 'bold 28px "DM Sans", Genta, sans-serif'
  ctx.fillText((member?.displayName || user.username).substring(0, 22), TX, AY - 50)

  // tag
  ctx.fillStyle = '#aaaaaa'
  ctx.font      = '16px "DM Sans", sans-serif'
  ctx.fillText(`@${user.username}`, TX, AY - 24)

  // nivel y puntos
  ctx.fillStyle = '#5865F2'
  ctx.font      = 'bold 20px "DM Sans", sans-serif'
  ctx.fillText(`Nivel ${data.level ?? 1}`, TX, AY + 10)

  ctx.fillStyle = '#cccccc'
  ctx.font      = '15px "DM Sans", sans-serif'
  ctx.fillText(`${fmt(data.points ?? 0)} / ${fmt(data.neededpoints ?? 400)} XP`, TX + 100, AY + 10)

  // barra XP
  const BX = TX, BY = AY + 28, BW = W - TX - 40, BH = 14
  const progress = Math.min(1, (data.points ?? 0) / (data.neededpoints ?? 400))
  ctx.fillStyle = '#2e2e3e'
  clipRounded(ctx, BX, BY, BW, BH, 7)
  ctx.fill()
  if (progress > 0) {
    const grad = ctx.createLinearGradient(BX, 0, BX + BW, 0)
    grad.addColorStop(0, '#5865F2')
    grad.addColorStop(1, '#7289da')
    ctx.fillStyle = grad
    clipRounded(ctx, BX, BY, BW * progress, BH, 7)
    ctx.fill()
  }

  // rank badge
  ctx.fillStyle = '#5865F2'
  clipRounded(ctx, W - 130, 20, 100, 36, 8)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font      = 'bold 18px "DM Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`#${rank}`, W - 80, 44)
  ctx.textAlign = 'left'

  // voz (si tiene datos)
  if ((data.voicelevel ?? 1) > 1 || (data.voicepoints ?? 0) > 0) {
    ctx.fillStyle = '#888888'
    ctx.font      = '13px "DM Sans", sans-serif'
    ctx.fillText(`🎙️ Voz: Nivel ${data.voicelevel ?? 1} · ${fmt(data.voicepoints ?? 0)} XP`, TX, AY + 60)
  }

  return canvas.toBuffer('image/png')
}

module.exports = {
  name: 'rank',
  description: 'Ver tu tarjeta de rango o la de otro usuario',
  cooldown: 5,
  options: [
    { User: { name: 'usuario', description: 'Usuario a consultar', required: false } },
  ],

  run: async (client, interaction) => {
    const target = interaction.options.getUser('usuario') || interaction.user
    if (target.bot)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Los bots no tienen ranking.')], ephemeral: true })

    const gid = interaction.guild.id
    const key = `${gid}-${target.id}`

    client.points?.ensure(key, {
      user: target.id,
      usertag: target.username,
      xpcounter: 1,
      guild: gid,
      points: 0,
      neededpoints: 400,
      level: 1,
      voicepoints: 0,
      neededvoicepoints: 400,
      voicelevel: 1,
      voicetime: 0,
      oldmessage: '',
    })

    const data = client.points?.get(key)
    if (!data)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x4f545c).setDescription('📊 No hay datos de ranking para ese usuario todavía.')], ephemeral: true })

    // calcular posición
    const all  = client.points.filter(p => p.guild === gid).map(p => p).sort((a, b) => (b.level - a.level) || (b.points - a.points))
    const rank = (all.findIndex(d => d.user === target.id) ?? -1) + 1 || '?'

    await interaction.deferReply()

    try {
      const member = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(() => null)
      const buffer = await buildRankCard(target, member, data, rank)
      const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' })

      await interaction.editReply({ files: [attachment] })
    } catch {
      // fallback embed si falla canvas
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(0x5865F2)
          .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
          .setTitle('📊 Tarjeta de Rango')
          .addFields(
            { name: '💬 Nivel',      value: `\`${data.level ?? 1}\``,       inline: true },
            { name: '✨ XP',         value: `\`${fmt(data.points ?? 0)}\``, inline: true },
            { name: '🎯 Necesita',   value: `\`${fmt(data.neededpoints ?? 400)}\``, inline: true },
            { name: '🎙️ Nivel voz',  value: `\`${data.voicelevel ?? 1}\``,  inline: true },
            { name: '🏆 Posición',   value: `\`#${rank}\``,                 inline: true },
          )
          .setFooter({ text: interaction.guild.name })],
      })
    }
  },
}
