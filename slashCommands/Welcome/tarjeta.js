const { EmbedBuilder } = require('discord.js')
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')
const FormData = require('form-data')
const axios    = require('axios')
const path     = require('path')
const { rgba, glow, drawStar, drawWaveAccents, drawSparkles, clipRounded } = require('../../handlers/canvasUtils')

try {
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/Genta.ttf'), 'Genta')
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/UbuntuMono.ttf'), 'UbuntuMono')
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/DMSans-Bold.ttf'), 'DM Sans')
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/DMSans-Regular.ttf'), 'DM Sans')
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/STIXGeneral.ttf'), 'STIXGeneral')
  GlobalFonts.registerFromPath(path.join(__dirname, '../../assets/fonts/Arial.ttf'), 'Arial')
} catch {}

const FONTS   = 'Genta, UbuntuMono, "DM Sans", STIXGeneral, Arial'
const DFONT   = '"DM Sans", STIXGeneral, Arial'
const ASSETS  = path.join(__dirname, '../../assets/welcome')
const BASE    = path.join(__dirname, '../../assets/base.png')
const BOT_PNG = path.join(__dirname, '../../assets/bot.png')

const AVAILABLE_COLORS = ['#030303','#25FA6C','#3A98F0','#8525FA','#FA2525','#FA9E25','#FAFA25','#FFFFF9','WHITE']
const DEFAULT_COLOR    = '#3A98F0'

function resolveFrameColor(raw) {
  if (!raw) return DEFAULT_COLOR
  const up = raw.toUpperCase().trim()
  if (up === 'WHITE' || up === '#FFFFFF') return 'WHITE'
  if (AVAILABLE_COLORS.includes(up)) return up
  return DEFAULT_COLOR
}

function css(fc) { return fc === 'WHITE' ? '#FFFFF9' : fc.toLowerCase() }

module.exports = {
  name: 'tarjeta',
  description: 'Previsualiza la tarjeta de bienvenida con tu avatar',
  options: [
    { User: { name: 'usuario', description: 'Usuario a previsualizar (por defecto: tú)', required: false } },
  ],

  run: async (client, interaction) => {
    const errEmbed = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)
    const target = interaction.options.getUser('usuario') || interaction.user
    const member = await interaction.guild.members.fetch(target.id).catch(() => null)
    if (!member) return interaction.reply({ embeds: [errEmbed('❌ Usuario no encontrado.')], ephemeral: true })

    await interaction.deferReply()
    const gid = interaction.guild.id

    try {
      const W = 1772, H = 633
      const canvas = createCanvas(W, H)
      const ctx    = canvas.getContext('2d')

      const fc   = resolveFrameColor(client.settings.get(gid, 'welcome.framecolor'))
      const cc   = css(fc)
      const hasD = client.settings.get(gid, 'welcome.discriminator')
      const hasS = client.settings.get(gid, 'welcome.servername')
      const hasMC = client.settings.get(gid, 'welcome.membercount')

      // ── 1. ROUNDED CANVAS CLIP ──────────────────────────────────────────────
      clipRounded(ctx, W, H, 28)

      // ── 2. FONDO ─────────────────────────────────────────────────────────────
      const customBg = client.settings.get(gid, 'welcome.background')
      if (customBg && customBg !== 'transparent') {
        try { ctx.drawImage(await loadImage(customBg), 0, 0, W, H) } catch {}
      } else {
        // base.png centrado como textura
        try {
          const base = await loadImage(BASE)
          const scale = Math.max(W / base.width, H / base.height)
          const dW = base.width * scale, dH = base.height * scale
          ctx.save(); ctx.globalAlpha = 0.22
          ctx.drawImage(base, (W-dW)/2, (H-dH)/2, dW, dH)
          ctx.globalAlpha = 1; ctx.restore()
        } catch {}

        // Dark overlay
        const dark = ctx.createLinearGradient(0, 0, W, H)
        dark.addColorStop(0, 'rgba(4,6,16,0.90)')
        dark.addColorStop(0.5, 'rgba(7,9,22,0.84)')
        dark.addColorStop(1, 'rgba(4,6,16,0.90)')
        ctx.fillStyle = dark; ctx.fillRect(0, 0, W, H)

        // Bezier wave corner accents
        drawWaveAccents(ctx, W, H, fc)

        // Ambient glows
        glow(ctx, 315, 316, 500, fc, 0.20)
        glow(ctx, W-220, 90,  300, fc, 0.09)
        glow(ctx, W-80,  H-80, 240, fc, 0.07)
        glow(ctx, W/2, H/2, 300, '#5865F2', 0.04)

        // Banner del usuario como fondo sutil (si tiene Nitro y banner)
        try {
          const fetchedUser = await interaction.client.users.fetch(target.id, { force: true })
          if (fetchedUser.banner) {
            const bannerURL = fetchedUser.bannerURL({ extension: 'png', size: 1024, forceStatic: true })
            const bannerImg = await loadImage(bannerURL)
            const scale = Math.max(W / bannerImg.width, H / bannerImg.height)
            const dW = bannerImg.width * scale, dH = bannerImg.height * scale
            ctx.save(); ctx.globalAlpha = 0.18
            ctx.drawImage(bannerImg, (W-dW)/2, (H-dH)/2, dW, dH)
            ctx.globalAlpha = 1; ctx.restore()
          }
        } catch {}

        // 4-point star sparkles
        drawSparkles(ctx, W, H, fc)
      }

      // ── 3. AVATAR con capas (ANTES del frame overlay) ───────────────────────
      const avCX = 315, avCY = 316, avR = 238
      const presence = member.presence?.status
      const statusColors = { online: '#57F287', idle: '#FEE75C', dnd: '#ED4245', streaming: '#593695' }
      const sColor = statusColors[presence] || null

      try {
        const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 512, forceStatic: true }))

        // Mega ambient halo
        glow(ctx, avCX, avCY, avR * 2.0, fc, 0.26)
        glow(ctx, avCX, avCY, avR * 1.3, fc, 0.16)

        // Outer decorative ring (thin, bright)
        ctx.save()
        ctx.beginPath(); ctx.arc(avCX, avCY, avR + 16, 0, Math.PI * 2); ctx.closePath()
        ctx.strokeStyle = rgba(fc, 0.22); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()

        // Gradient ring (thick)
        const ring = ctx.createLinearGradient(avCX - avR, avCY - avR, avCX + avR, avCY + avR)
        ring.addColorStop(0, cc)
        ring.addColorStop(0.3, rgba(fc, 0.60))
        ring.addColorStop(0.7, cc)
        ring.addColorStop(1, rgba(fc, 0.55))
        ctx.save()
        ctx.beginPath(); ctx.arc(avCX, avCY, avR + 10, 0, Math.PI * 2); ctx.closePath()
        ctx.fillStyle = ring; ctx.fill(); ctx.restore()

        // Dark gap
        ctx.save()
        ctx.beginPath(); ctx.arc(avCX, avCY, avR + 2, 0, Math.PI * 2); ctx.closePath()
        ctx.fillStyle = 'rgba(0,0,0,0.52)'; ctx.fill(); ctx.restore()

        // Avatar clip — with status cut-out if online (discord-card-canvas technique)
        ctx.save()
        ctx.beginPath()
        if (sColor) {
          // cut-out circle for status badge (bottom-right)
          const sx = avCX + avR * 0.700, sy = avCY + avR * 0.700
          ctx.arc(avCX, avCY, avR, 0, Math.PI * 2)
          ctx.arc(sx, sy, 22, 0, Math.PI * 2, true) // counter-clockwise = hole
        } else {
          ctx.arc(avCX, avCY, avR, 0, Math.PI * 2)
        }
        ctx.closePath(); ctx.clip()
        ctx.drawImage(avatar, avCX - avR, avCY - avR, avR * 2, avR * 2)
        // Bottom reflection
        const refl = ctx.createLinearGradient(avCX, avCY, avCX, avCY + avR)
        refl.addColorStop(0, 'transparent'); refl.addColorStop(1, 'rgba(0,0,0,0.28)')
        ctx.fillStyle = refl; ctx.fillRect(avCX - avR, avCY, avR * 2, avR)
        ctx.restore()

        // Status badge
        if (sColor) {
          const sx = avCX + avR * 0.700, sy = avCY + avR * 0.700
          ctx.save()
          ctx.beginPath(); ctx.arc(sx, sy, 20, 0, Math.PI * 2)
          ctx.fillStyle = '#111'; ctx.fill()
          ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI * 2)
          ctx.fillStyle = sColor; ctx.fill()
          ctx.restore()
        }
      } catch {}

      // ── 4. FRAME PNG overlay ──────────────────────────────────────────────────
      const fpName = hasD && hasS ? 'welcome3frame' : hasD ? 'welcome2frame_unten' : hasS ? 'welcome2frame_oben' : 'welcome1frame'
      try {
        ctx.drawImage(await loadImage(path.join(ASSETS, fc, `${fpName}.png`)), 0, 0, W, H)
        ctx.drawImage(await loadImage(path.join(ASSETS, fc, 'welcome1framepb.png')), 0, 0, W, H)
      } catch {}

      // ── 5. TEXTO ──────────────────────────────────────────────────────────────
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
      const TX = 718, TW = 1020

      // Barra de acento vertical
      const barGrd = ctx.createLinearGradient(700, 55, 700, H-55)
      barGrd.addColorStop(0, 'transparent'); barGrd.addColorStop(0.2, cc)
      barGrd.addColorStop(0.8, cc); barGrd.addColorStop(1, 'transparent')
      ctx.save(); ctx.shadowColor = cc; ctx.shadowBlur = 16
      ctx.strokeStyle = barGrd; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(700, 55); ctx.lineTo(700, H-55); ctx.stroke(); ctx.restore()

      // Nombre de servidor — auto-shrink sin truncado duro
      if (hasS) {
        const gname = interaction.guild.name
        let gfs = 54
        ctx.font = `bold ${gfs}px ${FONTS}`
        while (ctx.measureText(gname).width > TW && gfs > 20) { gfs -= 2; ctx.font = `bold ${gfs}px ${FONTS}` }
        let displayName = gname
        if (ctx.measureText(displayName).width > TW) {
          while (ctx.measureText(displayName + '…').width > TW && displayName.length > 2)
            displayName = displayName.slice(0, -1)
          displayName += '…'
        }
        ctx.save()
        ctx.shadowColor = rgba(fc, 0.85); ctx.shadowBlur = 20; ctx.shadowOffsetY = 2
        ctx.fillStyle = cc; ctx.fillText(displayName, TX, 168); ctx.restore()
      } else {
        ctx.font = `bold 24px ${DFONT}`; ctx.fillStyle = rgba(fc, 0.40)
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6
        ctx.fillText('— NUEVO MIEMBRO —', TX, 168); ctx.restore()
      }

      // Username — Genta, grande, con glow del color del frame
      const uname = member.user.username
      let ufs = 148
      ctx.font = `${ufs}px ${FONTS}`
      while (ctx.measureText(uname).width > TW && ufs > 46) { ufs -= 4; ctx.font = `${ufs}px ${FONTS}` }
      ctx.save()
      ctx.shadowColor = rgba(fc, 0.80); ctx.shadowBlur = 32; ctx.shadowOffsetY = 4
      ctx.fillStyle = '#FFFFFF'; ctx.fillText(uname, TX, 338); ctx.restore()

      // Discriminator
      if (hasD && member.user.discriminator && member.user.discriminator !== '0') {
        ctx.font = `bold 42px ${DFONT}`; ctx.fillStyle = rgba(fc, 0.65)
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 8
        ctx.fillText(`#${member.user.discriminator}`, TX, 392); ctx.restore()
      }

      // Línea separadora fade bajo el nombre
      const lineGrd = ctx.createLinearGradient(TX, 0, TX+800, 0)
      lineGrd.addColorStop(0, cc); lineGrd.addColorStop(0.55, rgba(fc, 0.38)); lineGrd.addColorStop(1, 'transparent')
      ctx.save(); ctx.shadowColor = cc; ctx.shadowBlur = 10
      ctx.strokeStyle = lineGrd; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(TX, 360); ctx.lineTo(TX+800, 360); ctx.stroke(); ctx.restore()

      // Member count
      if (hasMC) {
        ctx.font = `bold 46px ${DFONT}`; ctx.fillStyle = rgba(fc, 0.82)
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10
        ctx.fillText(`✦  Miembro #${interaction.guild.memberCount}`, TX, 518); ctx.restore()
      }

      // ── 6. WATERMARK bot.png ──────────────────────────────────────────────────
      try {
        const botImg = await loadImage(BOT_PNG)
        ctx.save(); ctx.globalAlpha = 0.22
        ctx.drawImage(botImg, W-96, H-58, 80, 52); ctx.restore()
      } catch {}

      // ── 7. ENVÍO ──────────────────────────────────────────────────────────────
      const buf  = await canvas.encode('png')
      const es   = client.settings.get(gid, 'embed') || {}
      const rawC = es.color
      const color = typeof rawC === 'number' ? rawC : parseInt(String(rawC||'').replace('#',''), 16) || 0x5865F2
      const msg = (client.settings.get(gid, 'welcome.msg') || '¡Bienvenido {user}!')
        .replace('{user}', `${member.user}`).replace('{username}', member.user.username)

      const form = new FormData()
      form.append('files[0]', buf, { filename: 'tarjeta-bienvenida.png', contentType: 'image/png' })
      form.append('payload_json', JSON.stringify({
        embeds: [{ color, description: msg || '​', image: { url: 'attachment://tarjeta-bienvenida.png' }, footer: { text: `Vista previa · ${interaction.user.username}` } }],
        attachments: [{ id: 0, filename: 'tarjeta-bienvenida.png' }],
      }))

      await axios.patch(
        `https://discord.com/api/v10/webhooks/${client.user.id}/${interaction.token}/messages/@original`,
        form, { headers: { ...form.getHeaders() } }
      )
    } catch (e) {
      console.error('[Tarjeta]', e?.response?.data || e.message)
      await interaction.editReply({ embeds: [errEmbed(`❌ Error: ${e.message}`)] })
    }
  },
}
