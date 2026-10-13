const { EmbedBuilder } = require('discord.js')
const FormData = require('form-data')
const axios = require('axios')
const { renderConfiguredWelcomeCard } = require('../../handlers/cards')
const { deliverCardPayload } = require('../../handlers/card-delivery')

module.exports = {
  name: 'test',
  description: 'Prueba el sistema de bienvenida simulando un nuevo miembro',
  memberpermissions: ['ManageGuild'],
  options: [
    { User: { name: 'usuario', description: 'Usuario para previsualizar (por defecto: tú)', required: false } },
  ],

  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)
    const target = interaction.options.getUser('usuario') || interaction.user
    const member = await interaction.guild.members.fetch(target.id).catch(() => null)
    if (!member) return interaction.reply({ embeds: [err('❌ Usuario no encontrado en el servidor.')], ephemeral: true })

    await interaction.deferReply()
    const guildId = interaction.guild.id
    const settings = client.settings.get(guildId, 'welcome')

    if (!settings || settings.channel === 'nochannel') {
      return interaction.editReply({ embeds: [err('❌ El sistema de bienvenida no está configurado.\nUsa `!setup-welcome` para configurarlo.')] })
    }

    try {
      const es      = client.settings.get(guildId, 'embed') || {}
      const rawC    = es.color
      const color   = typeof rawC === 'number' ? rawC : parseInt(String(rawC || '').replace('#', ''), 16) || 0x5865F2
      const rawMsg  = require('../../handlers/config-service').welcomeMessage(client.settings, guildId) || '¡Bienvenido {user} al servidor!'
      const description = require('../../handlers/welcome-message').renderWelcomeMessage(rawMsg, member.user, interaction.guild)

      const previewPayload = {
        content: `${member.user} — **Vista previa de la tarjeta de bienvenida**`,
        embeds: [{
          color,
          title: '👋 Bienvenido — Vista previa',
          description,
          image: { url: 'attachment://welcome-preview.png' },
          footer: { text: `ID: ${member.user.id}` },
          timestamp: new Date().toISOString(),
        }],
        attachments: [{ id: 0, filename: 'welcome-preview.png' }],
      }
      await deliverCardPayload({
        payload: previewPayload, filename: 'welcome-preview.png',
        capabilities: async () => ({ send: !client._shuttingDown, embed: true, attach: true }),
        render: () => renderConfiguredWelcomeCard(client.settings, member),
        send: async ({ payload, buffer }) => {
          const endpoint = `https://discord.com/api/v10/webhooks/${client.user.id}/${interaction.token}/messages/@original`
          if (!buffer) return (await axios.patch(endpoint, payload, { timeout: 10000 })).data
          const form = new FormData()
          form.append('files[0]', buffer, { filename: 'welcome-preview.png', contentType: 'image/png' })
          form.append('payload_json', JSON.stringify(payload))
          return (await axios.patch(endpoint, form, { headers: form.getHeaders(), timeout: 10000 })).data
        },
      })
    } catch (e) {
      if (client._shuttingDown) return
      console.error('[Welcome Test] No se pudo entregar la vista previa')
      await interaction.editReply({ embeds: [err('❌ No se pudo entregar la vista previa. Inténtalo de nuevo.')] })
    }
  },
}
