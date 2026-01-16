const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const {
  pick,
  EIGHTBALL,
  MAGIC_CONCH,
  JOKES,
  DAD_JOKES,
  PUNS,
  MEMES,
  FACTS,
  QUOTES,
  SHOWER_THOUGHTS,
  RIDDLES,
  WOULD_YOU_RATHER,
  TRUTHS,
  DARES,
  CONFESSIONS,
  FORTUNES,
  TOPICS_NORMAL,
  TOPICS_SPICY,
  HOROSCOPE,
  ROASTS,
  COMPLIMENTS
} = require('../../systems/fun/funContent')
const {
  reverseText,
  spoilerText,
  clapText,
  uwuText,
  mockText,
  zalgoText,
  boldText,
  smallcapsText,
  translateText,
  autocorrectText,
  summarizeFallback,
  emojiifyText,
  shrinkText,
  expandText,
  censorText
} = require('../../systems/fun/textTransforms')
const { renderTemplateOne, renderTemplateTwo } = require('../../systems/fun/funImages')
const { getAnimal } = require('../../systems/fun/animals')

function deterministicPercent (seed) {
  // Determinístico por seed para evitar spam (misma pareja => mismo %).
  const s = String(seed)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return (h % 101)
}

function buildImageEmbed (url, title) {
  return new EmbedBuilder().setTitle(title).setImage(url).setColor('Random')
}

module.exports = createSystemSlashCommand({
  name: 'fun',
  description: 'Diversión + social (alto volumen)',
  moduleKey: 'fun',
  defaultCooldownMs: 1_500,
  groups: [
    {
      name: 'content',
      description: 'Contenido aleatorio (8ball, jokes, facts, topics...)',
      subcommands: [
        {
          name: '8ball',
          description: 'Responde como 8ball',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('question').setDescription('Pregunta').setRequired(true).setMaxLength(200)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const q = interaction.options.getString('question', true)
            const embed = new EmbedBuilder()
              .setTitle('🎱 8Ball')
              .setColor('Blurple')
              .addFields(
                { name: 'Pregunta', value: q },
                { name: 'Respuesta', value: pick(EIGHTBALL) }
              )
              .setTimestamp()
            return interaction.reply({ embeds: [embed] })
          }
        },
        { name: 'joke', description: 'Chiste random', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(pick(JOKES)) },
        { name: 'dadjoke', description: 'Dad joke', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(pick(DAD_JOKES)) },
        { name: 'pun', description: 'Pun', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(pick(PUNS)) },
        {
          name: 'meme',
          description: 'Meme random',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const url = pick(MEMES)
            const embed = buildImageEmbed(url, 'Meme')
            return i.reply({ embeds: [embed] })
          }
        },
        { name: 'fact', description: 'Dato curioso', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(pick(FACTS)) },
        { name: 'quote', description: 'Cita', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(pick(QUOTES)) },
        { name: 'showerthought', description: 'Shower thought', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(pick(SHOWER_THOUGHTS)) },
        {
          name: 'riddle',
          description: 'Adivinanza',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const r = pick(RIDDLES)
            return i.reply({ content: `🧩 ${r.q}\n||Respuesta: ${r.a}||` })
          }
        },
        { name: 'wouldyourather', description: '¿Qué preferís?', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`🤔 ${pick(WOULD_YOU_RATHER)}`) },
        { name: 'truth', description: 'Truth', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`🗣️ ${pick(TRUTHS)}`) },
        { name: 'dare', description: 'Dare', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`🔥 ${pick(DARES)}`) },
        { name: 'confession', description: 'Confesión', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`🤫 ${pick(CONFESSIONS)}`) },
        {
          name: 'horoscope',
          description: 'Horóscopo por signo',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('sign').setDescription('Signo').setRequired(true).addChoices(
            { name: 'Aries', value: 'aries' },
            { name: 'Tauro', value: 'taurus' },
            { name: 'Géminis', value: 'gemini' },
            { name: 'Cáncer', value: 'cancer' },
            { name: 'Leo', value: 'leo' },
            { name: 'Virgo', value: 'virgo' },
            { name: 'Libra', value: 'libra' },
            { name: 'Escorpio', value: 'scorpio' },
            { name: 'Sagitario', value: 'sagittarius' },
            { name: 'Capricornio', value: 'capricorn' },
            { name: 'Acuario', value: 'aquarius' },
            { name: 'Piscis', value: 'pisces' }
          )) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const s = i.options.getString('sign', true)
            return i.reply({ content: `🔮 ${HOROSCOPE[s] || 'Signo inválido.'}` })
          }
        },
        { name: 'fortune', description: 'Fortuna', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`🥠 ${pick(FORTUNES)}`) },
        {
          name: 'topic',
          description: 'Tema random',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('tipo').setDescription('Tipo').setRequired(false).addChoices(
            { name: 'normal', value: 'normal' },
            { name: 'spicy', value: 'spicy' }
          )) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const tipo = i.options.getString('tipo') || 'normal'
            const pool = tipo === 'spicy' ? TOPICS_SPICY : TOPICS_NORMAL
            return i.reply(`🗣️ ${pick(pool)}`)
          }
        },
        {
          name: 'magicconch',
          description: 'Concha mágica',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('question').setDescription('Pregunta').setRequired(true).setMaxLength(200)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const q = i.options.getString('question', true)
            return i.reply({ content: `🐚 **${q}**\n→ ${pick(MAGIC_CONCH)}` })
          }
        }
      ]
    },
    {
      name: 'text',
      description: 'Transformaciones de texto',
      subcommands: [
        { name: 'reverse', description: 'Reverse', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(reverseText(i.options.getString('text', true))) },
        { name: 'spoiler', description: 'Spoiler', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(spoilerText(i.options.getString('text', true))) },
        { name: 'clap', description: 'Clap', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(clapText(i.options.getString('text', true))) },
        { name: 'uwu', description: 'UwU', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(uwuText(i.options.getString('text', true))) },
        { name: 'mock', description: 'Mock', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(mockText(i.options.getString('text', true))) },
        { name: 'zalgo', description: 'Zalgo', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)).addIntegerOption(o => o.setName('intensity').setDescription('1-15').setRequired(false).setMinValue(1).setMaxValue(15)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(zalgoText(i.options.getString('text', true), i.options.getInteger('intensity'))) },
        { name: 'bold', description: 'Bold', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(boldText(i.options.getString('text', true))) },
        { name: 'smallcaps', description: 'Smallcaps', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(smallcapsText(i.options.getString('text', true))) },
        {
          name: 'translate',
          description: 'Translate',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)).addStringOption(o => o.setName('lang').setDescription('Idioma destino (es/en/pt)').setRequired(true)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const t = i.options.getString('text', true)
            const lang = i.options.getString('lang', true)
            const out = await translateText(t, lang)
            return i.reply({ content: out, ephemeral: true })
          }
        },
        { name: 'autocorrect', description: 'Autocorrect', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: autocorrectText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'summarize', description: 'Summarize', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(1800)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: summarizeFallback(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'emojiify', description: 'Emojiify', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: emojiifyText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'shrink', description: 'Shrink', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: shrinkText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'expand', description: 'Expand', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: expandText(i.options.getString('text', true)), ephemeral: true }) },
        { name: 'censor', description: 'Censor', options: [{ apply: (sc) => sc.addStringOption(o => o.setName('text').setDescription('Texto').setRequired(true).setMaxLength(1800)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: censorText(i.options.getString('text', true)), ephemeral: true }) }
      ]
    },
    {
      name: 'image',
      description: 'Imágenes con avatar',
      subcommands: [
        { name: 'avatar', description: 'Avatar', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const u = i.options.getUser('user') || i.user; return i.reply(u.displayAvatarURL({ extension: 'png', size: 1024 })) } },
        { name: 'wanted', description: 'Wanted', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const u = i.options.getUser('user') || i.user; const att = await renderTemplateOne({ user: u, template: 'wanted' }); return i.reply({ files: [att] }) } },
        { name: 'trash', description: 'Trash', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const u = i.options.getUser('user') || i.user; const att = await renderTemplateOne({ user: u, template: 'trash' }); return i.reply({ files: [att] }) } },
        { name: 'triggered', description: 'Triggered', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const u = i.options.getUser('user') || i.user; const att = await renderTemplateOne({ user: u, template: 'triggered' }); return i.reply({ files: [att] }) } },
        { name: 'jail', description: 'Jail', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const u = i.options.getUser('user') || i.user; const att = await renderTemplateOne({ user: u, template: 'jail' }); return i.reply({ files: [att] }) } },
        { name: 'rip', description: 'RIP', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const u = i.options.getUser('user') || i.user; const att = await renderTemplateOne({ user: u, template: 'rip' }); return i.reply({ files: [att] }) } },
        { name: 'beautiful', description: 'Beautiful', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const u = i.options.getUser('user') || i.user; const att = await renderTemplateOne({ user: u, template: 'beautiful' }); return i.reply({ files: [att] }) } },
        { name: 'kiss', description: 'Kiss (2 avatars)', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const u = i.options.getUser('user', true); const att = await renderTemplateTwo({ user1: i.user, user2: u, template: 'kiss' }); return i.reply({ content: `💋 ${i.user} besó a ${u}`, files: [att] }) } },
        { name: 'slap', description: 'Slap (2 avatars)', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const u = i.options.getUser('user', true); const att = await renderTemplateTwo({ user1: i.user, user2: u, template: 'slap' }); return i.reply({ content: `👋 ${i.user} cacheteó a ${u}`, files: [att] }) } }
      ]
    },
    {
      name: 'social',
      description: 'Social: ship, rate, choose, rng',
      subcommands: [
        {
          name: 'ship',
          description: 'Ship (user1 + user2)',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user1').setDescription('User 1').setRequired(true)).addUserOption(o => o.setName('user2').setDescription('User 2').setRequired(true)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const u1 = i.options.getUser('user1', true)
            const u2 = i.options.getUser('user2', true)
            const score = deterministicPercent(`${i.guild.id}:${u1.id}:${u2.id}`)
            return i.reply(`💞 ${u1} x ${u2} → **${score}%**`)
          }
        },
        {
          name: 'rate',
          description: 'Rate a thing',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('thing').setDescription('Cosa').setRequired(true).setMaxLength(200)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const thing = i.options.getString('thing', true)
            const score = deterministicPercent(`${i.guild.id}:${thing}`)
            return i.reply(`⭐ **${thing}** → **${score}/100**`)
          }
        },
        {
          name: 'choose',
          description: 'Choose',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('a').setDescription('Opción 1').setRequired(true))
            .addStringOption(o => o.setName('b').setDescription('Opción 2').setRequired(true))
            .addStringOption(o => o.setName('c').setDescription('Opción 3').setRequired(false))
            .addStringOption(o => o.setName('d').setDescription('Opción 4').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const options = ['a', 'b', 'c', 'd'].map(k => i.options.getString(k)).filter(Boolean)
            return i.reply(`🎯 Elijo: **${pick(options)}**`)
          }
        },
        {
          name: 'random',
          description: 'Random number',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('min').setDescription('Min').setRequired(true)).addIntegerOption(o => o.setName('max').setDescription('Max').setRequired(true)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const min = i.options.getInteger('min', true)
            const max = i.options.getInteger('max', true)
            if (max < min) return i.reply({ content: 'Max debe ser >= min.', ephemeral: true })
            const n = Math.floor(Math.random() * (max - min + 1)) + min
            return i.reply(`🎲 ${n}`)
          }
        },
        { name: 'coinflip', description: 'Coinflip', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(Math.random() > 0.5 ? '🪙 Cara' : '🪙 Cruz') },
        {
          name: 'roll',
          description: 'Roll dice',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('sides').setDescription('Caras (2-1000)').setRequired(true).setMinValue(2).setMaxValue(1000)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const sides = i.options.getInteger('sides', true)
            const n = Math.floor(Math.random() * sides) + 1
            return i.reply(`🎲 d${sides} → **${n}**`)
          }
        }
        ,
        {
          name: 'roast',
          description: 'Roastea a un usuario (light)',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 4_000,
          handler: async (c, i) => {
            const u = i.options.getUser('user', true)
            return i.reply(`🔥 ${u} — ${pick(ROASTS)}`)
          }
        },
        {
          name: 'compliment',
          description: 'Cumplido a un usuario',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 3_000,
          handler: async (c, i) => {
            const u = i.options.getUser('user', true)
            return i.reply(`✨ ${u} — ${pick(COMPLIMENTS)}`)
          }
        },
        {
          name: 'pp',
          description: 'PP meme',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const u = i.options.getUser('user') || i.user
            const size = deterministicPercent(`${i.guild.id}:pp:${u.id}`) % 16
            return i.reply(`🍆 ${u.username} → ${'='.repeat(size)}D`)
          }
        },
        {
          name: 'iq',
          description: 'IQ meme',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const u = i.options.getUser('user') || i.user
            const score = deterministicPercent(`${i.guild.id}:iq:${u.id}`)
            return i.reply(`🧠 IQ de ${u}: **${score}**`)
          }
        },
        {
          name: 'gayrate',
          description: 'Gayrate meme',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const u = i.options.getUser('user') || i.user
            const score = deterministicPercent(`${i.guild.id}:gayrate:${u.id}`)
            return i.reply(`🏳️‍🌈 ${u} → **${score}%**`)
          }
        },
        {
          name: 'hotrate',
          description: 'Hotrate meme',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const u = i.options.getUser('user') || i.user
            const score = deterministicPercent(`${i.guild.id}:hotrate:${u.id}`)
            return i.reply(`🔥 ${u} → **${score}%**`)
          }
        },
        {
          name: 'coolrate',
          description: 'Coolrate meme',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (c, i) => {
            const u = i.options.getUser('user') || i.user
            const score = deterministicPercent(`${i.guild.id}:coolrate:${u.id}`)
            return i.reply(`😎 ${u} → **${score}%**`)
          }
        }
      ]
    },
    {
      name: 'interact',
      description: 'Interacciones rápidas',
      subcommands: [
        { name: 'hug', description: 'Hug', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`🫂 ${i.user} abrazó a ${i.options.getUser('user', true)}`) },
        { name: 'kiss', description: 'Kiss', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`💋 ${i.user} besó a ${i.options.getUser('user', true)}`) },
        { name: 'slap', description: 'Slap', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`👋 ${i.user} cacheteó a ${i.options.getUser('user', true)}`) },
        { name: 'pat', description: 'Pat', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`🫳 ${i.user} hizo pat pat a ${i.options.getUser('user', true)}`) },
        { name: 'cuddle', description: 'Cuddle', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`🧸 ${i.user} abrazó fuerte a ${i.options.getUser('user', true)}`) },
        { name: 'highfive', description: 'Highfive', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`🙏 ${i.user} chocó esos cinco con ${i.options.getUser('user', true)}`) },
        { name: 'poke', description: 'Poke', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`👉 ${i.user} pokéo a ${i.options.getUser('user', true)}`) },
        { name: 'wave', description: 'Wave', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const u = i.options.getUser('user'); return i.reply(u ? `👋 ${i.user} saludó a ${u}` : `👋 ${i.user} saluda!`) } },
        { name: 'boop', description: 'Boop', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`👉👃 ${i.user} boop a ${i.options.getUser('user', true)}`) },
        { name: 'stare', description: 'Stare', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`👀 ${i.user} está mirando a ${i.options.getUser('user', true)}`) },
        { name: 'dance', description: 'Dance', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`💃 ${i.user} se puso a bailar`) },
        { name: 'cry', description: 'Cry', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`😭 ${i.user} está llorando`) },
        { name: 'laugh', description: 'Laugh', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply(`😂 ${i.user} se ríe`) }
      ]
    },
    {
      name: 'animals',
      description: 'Animales (imagen)',
      subcommands: [
        { name: 'cat', description: 'Cat', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const a = await getAnimal('cat'); return i.reply({ content: a.fact ? `🐱 ${a.fact}` : '🐱', embeds: [buildImageEmbed(a.image, 'Cat')] }) } },
        { name: 'dog', description: 'Dog', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const a = await getAnimal('dog'); return i.reply({ content: a.fact ? `🐶 ${a.fact}` : '🐶', embeds: [buildImageEmbed(a.image, 'Dog')] }) } },
        { name: 'fox', description: 'Fox', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const a = await getAnimal('fox'); return i.reply({ embeds: [buildImageEmbed(a.image, 'Fox')] }) } },
        { name: 'panda', description: 'Panda', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const a = await getAnimal('panda'); return i.reply({ content: a.fact ? `🐼 ${a.fact}` : '🐼', embeds: [buildImageEmbed(a.image, 'Panda')] }) } },
        { name: 'bunny', description: 'Bunny', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const a = await getAnimal('bunny'); return i.reply({ content: a.fact ? `🐰 ${a.fact}` : '🐰', embeds: [buildImageEmbed(a.image, 'Bunny')] }) } },
        { name: 'duck', description: 'Duck', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const a = await getAnimal('duck'); return i.reply({ embeds: [buildImageEmbed(a.image, 'Duck')] }) } },
        { name: 'capybara', description: 'Capybara', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => { const a = await getAnimal('capybara'); return i.reply({ content: a.fact ? `🦫 ${a.fact}` : '🦫', embeds: [buildImageEmbed(a.image, 'Capybara')] }) } }
      ]
    }
  ]
})
