const { EmbedBuilder } = require('discord.js')
const FormData = require('form-data')
const axios = require('axios')
const { renderConfiguredWelcomeCard } = require('../../handlers/cards')

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
      const buf = await renderConfiguredWelcomeCard(client.settings, member)
      const es      = client.settings.get(guildId, 'embed') || {}
      const rawC    = es.color
      const color   = typeof rawC === 'number' ? rawC : parseInt(String(rawC || '').replace('#', ''), 16) || 0x5865F2
      const rawMsg  = require('../../handlers/config-service').welcomeMessage(client.settings, guildId) || '¡Bienvenido {user} al servidor!'
      const description = require('../../handlers/welcome-message').renderWelcomeMessage(rawMsg, member.user, interaction.guild)

      const form = new FormData()
      form.append('files[0]', buf, { filename: 'welcome-preview.png', contentType: 'image/png' })
      form.append('payload_json', JSON.stringify({
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
      }))

      const appId = client.user.id
      await axios.patch(
        `https://discord.com/api/v10/webhooks/${appId}/${interaction.token}/messages/@original`,
        form,
        { headers: { ...form.getHeaders() } }
      )
    } catch (e) {
      console.error('[Welcome Test]', JSON.stringify(e?.response?.data, null, 2) || e.message)
      await interaction.editReply({ embeds: [err(`❌ Error al generar la tarjeta: ${e.message || e}`)] })
    }
  },
}
