const { EmbedBuilder } = require('discord.js')
const FormData = require('form-data')
const axios = require('axios')
const { renderConfiguredWelcomeCard } = require('../../handlers/cards')

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
      const buf = await renderConfiguredWelcomeCard(client.settings, member)
      const es   = client.settings.get(gid, 'embed') || {}
      const rawC = es.color
      const color = typeof rawC === 'number' ? rawC : parseInt(String(rawC||'').replace('#',''), 16) || 0x5865F2
      const msg = require('../../handlers/welcome-message').renderWelcomeMessage(
        require('../../handlers/config-service').welcomeMessage(client.settings, gid) || '¡Bienvenido {user}!', member.user, interaction.guild)

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
