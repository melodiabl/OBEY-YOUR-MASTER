const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const UserSchema = require('../../database/schemas/UserSchema')
const ItemSchema = require('../../database/schemas/ItemSchema')
const { listShop, getItem, buyItem, sellItem, giveItem, addToInventory, removeFromInventory } = require('../../systems/items/itemsService')

function normalizeInventory (inv) {
  return Array.isArray(inv) ? inv : []
}

function invLine (x) {
  return `- \`${x.itemId}\` x**${x.qty}**`
}

function pickN (arr, n) {
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = copy[i]
    copy[i] = copy[j]
    copy[j] = t
  }
  return copy.slice(0, n)
}

module.exports = createSystemSlashCommand({
  name: 'items',
  description: 'Inventario, ítems y tienda (escalable)',
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
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('buscar').setDescription('Filtro (opcional)').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const q = interaction.options.getString('buscar') || ''
            const items = await listShop({ query: q })
            if (!items.length) return interaction.reply({ content: 'No hay items con ese filtro.', ephemeral: true })
            const lines = items.map(i => `- \`${i.itemId}\` **${i.name}** • buy $${i.buyPrice} (sell $${i.sellPrice})`)
            return interaction.reply({ content: `**Tienda**\n${lines.join('\n')}`, ephemeral: true })
          }
        },
        {
          name: 'info',
          description: 'Info de un item',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('item').setDescription('ID del item').setRequired(true).setAutocomplete(true)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const itemId = interaction.options.getString('item', true)
            const it = await getItem(itemId)
            if (!it) return interaction.reply({ content: 'Item inválido.', ephemeral: true })
            const embed = new EmbedBuilder()
              .setTitle(`${it.name} (${it.itemId})`)
              .setColor('Blurple')
              .setDescription(it.description || '*Sin descripción*')
              .addFields(
                { name: 'Tipo', value: String(it.type || 'N/A'), inline: true },
                { name: 'Buy', value: `$${it.buyPrice}`, inline: true },
                { name: 'Sell', value: `$${it.sellPrice}`, inline: true }
              )
              .setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        },
        {
          name: 'buy',
          description: 'Compra un item',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('item').setDescription('ID del item').setRequired(true).setAutocomplete(true)).addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(false).setMinValue(1).setMaxValue(100)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 3_000,
          handler: async (client, interaction) => {
            const itemId = interaction.options.getString('item', true)
            const qty = interaction.options.getInteger('cantidad') || 1
            const res = await buyItem({ client, guildID: interaction.guild.id, userID: interaction.user.id, itemId, qty })
            return interaction.reply({ content: `ƒo. Compraste **${res.qty}x** \`${res.item.itemId}\` por **$${res.total}**.`, ephemeral: true })
          }
        },
        {
          name: 'sell',
          description: 'Vende un item',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('item').setDescription('ID del item').setRequired(true).setAutocomplete(true)).addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(false).setMinValue(1).setMaxValue(100)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 3_000,
          handler: async (client, interaction) => {
            const itemId = interaction.options.getString('item', true)
            const qty = interaction.options.getInteger('cantidad') || 1
            const res = await sellItem({ client, guildID: interaction.guild.id, userID: interaction.user.id, itemId, qty })
            return interaction.reply({ content: `ƒo. Vendiste **${res.qty}x** \`${res.item.itemId}\` por **$${res.total}**.`, ephemeral: true })
          }
        },
        {
          name: 'dailydeals',
          description: 'Muestra ofertas del día (random)',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const all = await listShop({ query: '' })
            if (!all.length) return interaction.reply({ content: 'No hay items en tienda.', ephemeral: true })
            const picks = pickN(all, Math.min(5, all.length))
            const lines = picks.map(i => `- \`${i.itemId}\` **${i.name}** • buy $${i.buyPrice}`)
            return interaction.reply({ content: `**Daily Deals**\n${lines.join('\n')}`, ephemeral: true })
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
          description: 'Muestra inventario (tuyo o de otro usuario)',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario (opcional)').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction, { identity }) => {
            const target = interaction.options.getUser('usuario') || interaction.user
            if (target.id !== interaction.user.id && identity?.role === INTERNAL_ROLES.USER) {
              return interaction.reply({ content: 'Solo MOD+ puede ver inventarios de otros usuarios.', ephemeral: true })
            }
            const user = await client.db.getUserData(target.id)
            const inv = normalizeInventory(user.inventory)
            if (!inv.length) return interaction.reply({ content: 'Inventario vacío.', ephemeral: true })
            const lines = inv.slice(0, 25).map(invLine)
            const embed = new EmbedBuilder().setTitle(`Inventario • ${target.username}`).setColor('Blurple').setDescription(lines.join('\n')).setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        },
        {
          name: 'remove',
          description: 'Descarta items de tu inventario',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('item').setDescription('ID del item').setRequired(true).setAutocomplete(true)).addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true).setMinValue(1).setMaxValue(100)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const itemId = interaction.options.getString('item', true)
            const qty = interaction.options.getInteger('cantidad', true)
            await removeFromInventory({ userID: interaction.user.id, itemId, qty })
            return interaction.reply({ content: `ƒo. Descartaste **${qty}x** \`${itemId}\`.`, ephemeral: true })
          }
        },
        {
          name: 'give',
          description: 'Entrega un item a otro usuario',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Destino').setRequired(true)).addStringOption(o => o.setName('item').setDescription('ID del item').setRequired(true).setAutocomplete(true)).addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(false).setMinValue(1).setMaxValue(100)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 3_000,
          handler: async (client, interaction) => {
            const target = interaction.options.getUser('usuario', true)
            const itemId = interaction.options.getString('item', true)
            const qty = interaction.options.getInteger('cantidad') || 1
            if (target.bot) return interaction.reply({ content: 'No puedes dar items a bots.', ephemeral: true })
            const res = await giveItem({ fromUserID: interaction.user.id, toUserID: target.id, itemId, qty })
            return interaction.reply({ content: `ƒo. Entregaste **${res.qty}x** \`${res.item.itemId}\` a <@${target.id}>.`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'admin',
      description: 'Admin (drop/remove/prices)',
      subcommands: [
        {
          name: 'drop',
          description: 'Da items a un usuario',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)).addStringOption(o => o.setName('item').setDescription('ID').setRequired(true).setAutocomplete(true)).addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true).setMinValue(1).setMaxValue(1000)) }],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.ITEMS_ADMIN] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('usuario', true)
            const itemId = interaction.options.getString('item', true)
            const qty = interaction.options.getInteger('cantidad', true)
            await addToInventory({ userID: user.id, itemId, qty })
            return interaction.reply({ content: `ƒo. Drop: **${qty}x** \`${itemId}\` a <@${user.id}>.`, ephemeral: true })
          }
        },
        {
          name: 'take',
          description: 'Quita items a un usuario',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)).addStringOption(o => o.setName('item').setDescription('ID').setRequired(true).setAutocomplete(true)).addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true).setMinValue(1).setMaxValue(1000)) }],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.ITEMS_ADMIN] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('usuario', true)
            const itemId = interaction.options.getString('item', true)
            const qty = interaction.options.getInteger('cantidad', true)
            await removeFromInventory({ userID: user.id, itemId, qty })
            return interaction.reply({ content: `ƒo. Take: **${qty}x** \`${itemId}\` a <@${user.id}>.`, ephemeral: true })
          }
        },
        {
          name: 'setprice',
          description: 'Set buy/sell price de un item',
          options: [
            {
              apply: (sc) =>
                sc
                  .addStringOption(o => o.setName('item').setDescription('ID').setRequired(true).setAutocomplete(true))
                  .addIntegerOption(o => o.setName('buy').setDescription('Buy price').setRequired(true).setMinValue(0).setMaxValue(1_000_000_000))
                  .addIntegerOption(o => o.setName('sell').setDescription('Sell price').setRequired(true).setMinValue(0).setMaxValue(1_000_000_000))
            }
          ],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.ITEMS_ADMIN] },
          handler: async (client, interaction) => {
            const itemId = interaction.options.getString('item', true)
            const buy = interaction.options.getInteger('buy', true)
            const sell = interaction.options.getInteger('sell', true)
            const updated = await ItemSchema.findOneAndUpdate({ itemId }, { $set: { buyPrice: buy, sellPrice: sell } }, { new: true })
            if (!updated) return interaction.reply({ content: 'Item inválido.', ephemeral: true })
            return interaction.reply({ content: `ƒo. Price update: \`${itemId}\` buy=$${buy} sell=$${sell}`, ephemeral: true })
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
      const candidates = await listShop({ query: q })
      for (const it of candidates) {
        if (suggestions.length >= 25) break
        suggestions.push({ name: `${it.name} (${it.itemId})`, value: it.itemId })
      }
    }

    return interaction.respond(suggestions.slice(0, 25))
  }
})

