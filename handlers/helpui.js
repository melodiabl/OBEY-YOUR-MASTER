// Lógica compartida del Centro de Ayuda estilo Soundy (usada por prefix y slash help).
// Navega client.commands por categoría (emoji unicode de la carpeta, en el label).
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')

const PRIMARY = 0x00ff33   // verde estilo Soundy
const PER_PAGE = 5

function splitEmoji(cat) {
  const parts = String(cat).trim().split(/\s+/)
  const first = parts[0]
  if (first && /\p{Extended_Pictographic}/u.test(first)) {
    return { emoji: first, label: parts.slice(1).join(' ') || String(cat) }
  }
  return { emoji: '📂', label: String(cat) }
}

function getCategories(client) {
  return [...new Set(client.commands.map(c => c.category).filter(Boolean))].sort()
}

function homeEmbed(client, userId, categories, prefix) {
  const bot = client.user.username
  const invite = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`
  const support = process.env.SUPPORT_SERVER || `https://discord.gg/`
  return new EmbedBuilder()
    .setColor(PRIMARY)
    .setTitle(`Menú de Ayuda de ${bot}`)
    .setDescription([
      `**¡Hola <@${userId}>! Soy ${bot}, tu compañero musical 🎶**`,
      '',
      `**${bot} es un bot todo-en-uno: música, moderación, economía, niveles, diversión y mucho más. Con ${client.commands.size} comandos repartidos en ${categories.length} categorías.**`,
      '',
      categories.map(c => { const { emoji, label } = splitEmoji(c); return `${emoji} : **${label}**` }).join('\n'),
      '',
      '**Selecciona una categoría en el menú de abajo.**',
      '',
      `**[Invítame](${invite}) • [Servidor de Soporte](${support})**`,
    ].join('\n'))
    .setImage(client.user.displayAvatarURL({ size: 512 }))
    .setFooter({ text: `¡Gracias por elegir ${bot}!`, iconURL: client.user.displayAvatarURL() })
    .setTimestamp()
}

function buildMenu(categories) {
  return new StringSelectMenuBuilder()
    .setCustomId('hm_select')
    .setPlaceholder('📂 Elige una categoría…')
    .addOptions(categories.slice(0, 25).map(c => ({
      label: String(c).slice(0, 95),
      value: String(c).slice(0, 100),
      description: 'Ver sus comandos',
    })))
}

function buildPages(client, cat, prefix) {
  const { emoji, label } = splitEmoji(cat)
  const cmds = client.commands.filter(c => c.category === cat).map(c => c)
    .sort((a, b) => a.name.localeCompare(b.name))
  const totalPages = Math.max(1, Math.ceil(cmds.length / PER_PAGE))
  const pages = []
  for (let i = 0; i < cmds.length; i += PER_PAGE) {
    const slice = cmds.slice(i, i + PER_PAGE)
    const desc = slice.map(c =>
      `**${prefix}${c.name}**\n\`\`\`${(c.description || 'Sin descripción').slice(0, 100)}\`\`\``
    ).join('\n')
    pages.push(new EmbedBuilder()
      .setColor(PRIMARY)
      .setTitle(`${emoji} Comandos de ${label}`)
      .setDescription(desc || '_Sin comandos_')
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: `Página ${Math.floor(i / PER_PAGE) + 1}/${totalPages} • ${cmds.length} comandos` })
      .setTimestamp())
  }
  return pages.length ? pages : [new EmbedBuilder().setColor(PRIMARY).setDescription('_Sin comandos en esta categoría_')]
}

function navRows(menu, page, total) {
  return [
    new ActionRowBuilder().addComponents(menu),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('hm_prev').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
      new ButtonBuilder().setCustomId('hm_home').setEmoji('🏠').setLabel('Inicio').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('hm_next').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(page >= total - 1),
    ),
  ]
}

function commandDetail(client, cmd, prefix) {
  const e = new EmbedBuilder()
    .setColor(PRIMARY)
    .setAuthor({ name: `Comando: ${cmd.name}`, iconURL: client.user.displayAvatarURL() })
    .setDescription(`\`\`\`${cmd.description || 'Sin descripción'}\`\`\``)
  if (cmd.category) e.addFields({ name: '📂 Categoría', value: `\`${cmd.category}\``, inline: true })
  if (cmd.aliases?.length) e.addFields({ name: '🔁 Alias', value: cmd.aliases.map(a => `\`${a}\``).join(' '), inline: true })
  if (cmd.usage) e.addFields({ name: '⌨️ Uso', value: `\`${prefix}${cmd.usage}\`` })
  return e
}

// Conecta el collector de componentes a un mensaje (prefix o slash) para navegar.
function attachCollector(client, msg, ownerId, prefix, home, menu) {
  let pages = [], page = 0
  const collector = msg.createMessageComponentCollector({ time: 180000 })
  collector.on('collect', async i => {
    if (i.user.id !== ownerId) return i.reply({ content: 'Este menú no es tuyo. Usa `' + prefix + 'help`.', ephemeral: true }).catch(() => {})
    try {
      if (i.isStringSelectMenu() && i.customId === 'hm_select') {
        pages = buildPages(client, i.values[0], prefix); page = 0
        return i.update({ embeds: [pages[0]], components: navRows(menu, 0, pages.length) }).catch(() => {})
      }
      if (i.isButton()) {
        if (i.customId === 'hm_home') return i.update({ embeds: [home], components: [new ActionRowBuilder().addComponents(menu)] }).catch(() => {})
        page = i.customId === 'hm_next' ? Math.min(pages.length - 1, page + 1) : Math.max(0, page - 1)
        return i.update({ embeds: [pages[page]], components: navRows(menu, page, pages.length) }).catch(() => {})
      }
    } catch {}
  })
  collector.on('end', () => msg.edit({ components: [] }).catch(() => {}))
}

module.exports = {
  splitEmoji, getCategories, homeEmbed, buildMenu, buildPages, navRows, commandDetail, attachCollector,
}
