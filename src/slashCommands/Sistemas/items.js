const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const UserSchema = require('../../database/schemas/UserSchema')
const { listShop, buyItem, sellItem, getItem } = require('../../systems/items/itemsService')

function normalizeInventory (inv) {
  return Array.isArray(inv) ? inv : []
}

module.exports = createSystemSlashCommand({
  name: 'items',
  description: 'Inventario, ítems y tienda (base)',
  moduleKey: 'items',
  defaultCooldownMs: 2_000,
  groups: [
    {
      name: 'shop',
      description: 'Tienda',
      subcommands: [
        {
          name: 'list',
          description: 'Lista items en venta',
          options: [
            {
              apply: (sc) =>
                sc.addStringOption(o =>
                  o.setName('buscar').setDescription('Filtro (opcional)').setRequired(false)
                )
            }
          ],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const q = interaction.options.getString('buscar') || ''
            const items = await listShop({ query: q })
            if (!items.length) return interaction.reply({ content: 'No hay items con ese filtro.', ephemeral: true })
            const lines = items.map(i => `- \`${i.itemId}\` **${i.name}** — $${i.buyPrice} (sell $${i.sellPrice})`)
            return interaction.reply({ content: `**Tienda**\n${lines.join('\n')}`, ephemeral: true })
          }
        },
        {
          name: 'buy',
          description: 'Compra un item',
          options: [
            {
              apply: (sc) =>
                sc
                  .addStringOption(o => o.setName('item').setDescription('ID del item').setRequired(true).setAutocomplete(true))
                  .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(false).setMinValue(1).setMaxValue(100))
            }
          ],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 3_000,
          handler: async (client, interaction) => {
            const itemId = interaction.options.getString('item', true)
            const qty = interaction.options.getInteger('cantidad') || 1
            const res = await buyItem({ client, guildID: interaction.guild.id, userID: interaction.user.id, itemId, qty })
            return interaction.reply({ content: `✅ Compraste **${res.qty}x** \`${res.item.itemId}\` por **$${res.total}**.`, ephemeral: true })
          }
        },
        {
          name: 'sell',
          description: 'Vende un item',
          options: [
            {
              apply: (sc) =>
                sc
                  .addStringOption(o => o.setName('item').setDescription('ID del item').setRequired(true).setAutocomplete(true))
                  .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(false).setMinValue(1).setMaxValue(100))
            }
          ],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 3_000,
          handler: async (client, interaction) => {
            const itemId = interaction.options.getString('item', true)
            const qty = interaction.options.getInteger('cantidad') || 1
            const res = await sellItem({ client, guildID: interaction.guild.id, userID: interaction.user.id, itemId, qty })
            return interaction.reply({ content: `✅ Vendiste **${res.qty}x** \`${res.item.itemId}\` por **$${res.total}**.`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'inv',
      description: 'Inventario',
      subcommands: [
        {
          name: 'show',
          description: 'Muestra tu inventario',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const user = await client.db.getUserData(interaction.user.id)
            const inv = normalizeInventory(user.inventory)
            if (!inv.length) return interaction.reply({ content: 'Tu inventario está vacío.', ephemeral: true })
            const lines = inv.slice(0, 25).map(x => `- \`${x.itemId}\` x**${x.qty}**`)
            const embed = new EmbedBuilder().setTitle('🎒 Inventario').setColor('Blurple').setDescription(lines.join('\n')).setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        }
      ]
    }
  ],

  async autocomplete (client, interaction) {
    const focused = interaction.options.getFocused(true)
    if (focused.name !== 'item') return interaction.respond([])
    const q = String(focused.value || '').toLowerCase()

    // Preferir items del inventario del usuario, luego catálogo.
    const user = await UserSchema.findOne({ userID: interaction.user.id })
    const invIds = new Set((normalizeInventory(user?.inventory)).map(x => x.itemId))
    const suggestions = []

    for (const id of invIds) {
      if (!String(id).toLowerCase().includes(q)) continue
      suggestions.push({ name: `${id} (inv)`, value: id })
    }

    if (suggestions.length < 25) {
      // Catálogo: sólo ids que matchean.
      const candidates = await require('../../systems/items/itemsService').listShop({ query: q })
      for (const it of candidates) {
        if (suggestions.length >= 25) break
        suggestions.push({ name: `${it.name} (${it.itemId})`, value: it.itemId })
      }
    }

    return interaction.respond(suggestions.slice(0, 25))
  }
})

