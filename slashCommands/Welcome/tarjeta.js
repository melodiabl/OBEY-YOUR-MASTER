const { EmbedBuilder } = require('discord.js')
const FormData = require('form-data')
const axios = require('axios')
const { renderConfiguredWelcomeCard } = require('../../handlers/cards')
const { deliverCardPayload } = require('../../handlers/card-delivery')

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
      const es   = client.settings.get(gid, 'embed') || {}
      const rawC = es.color
      const color = typeof rawC === 'number' ? rawC : parseInt(String(rawC||'').replace('#',''), 16) || 0x5865F2
      const msg = require('../../handlers/welcome-message').renderWelcomeMessage(
        require('../../handlers/config-service').welcomeMessage(client.settings, gid) || '¡Bienvenido {user}!', member.user, interaction.guild)

      const previewPayload = {
        embeds: [{ color, description: msg || '​', image: { url: 'attachment://tarjeta-bienvenida.png' }, footer: { text: `Vista previa · ${interaction.user.username}` } }],
        attachments: [{ id: 0, filename: 'tarjeta-bienvenida.png' }],
      }
      await deliverCardPayload({
        payload: previewPayload, filename: 'tarjeta-bienvenida.png',
        capabilities: async () => ({ send: true, embed: true, attach: true }),
        render: () => renderConfiguredWelcomeCard(client.settings, member),
        send: async ({ payload, buffer }) => {
          const endpoint = `https://discord.com/api/v10/webhooks/${client.user.id}/${interaction.token}/messages/@original`
          if (!buffer) return (await axios.patch(endpoint, payload, { timeout: 10000 })).data
          const form = new FormData()
          form.append('files[0]', buffer, { filename: 'tarjeta-bienvenida.png', contentType: 'image/png' })
          form.append('payload_json', JSON.stringify(payload))
          return (await axios.patch(endpoint, form, { headers: form.getHeaders(), timeout: 10000 })).data
        },
      })
    } catch (e) {
      console.error('[Tarjeta] No se pudo entregar la vista previa')
      await interaction.editReply({ embeds: [errEmbed('❌ No se pudo entregar la vista previa. Inténtalo de nuevo.')] })
    }
  },
}
