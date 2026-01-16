const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const UserSchema = require('../../database/schemas/UserSchema')
const EconomyTransactionSchema = require('../../database/schemas/EconomyTransactionSchema')
const { getBalances, transfer, deposit, withdraw, adminSet, fine } = require('../../systems/economy/economyService')
const {
  doAction,
  streamStart,
  streamCollect,
  streamStop,
  buyProtect,
  buyInsurance,
  robUser,
  protectStatus,
  insuranceStatus
} = require('../../systems/economy/ecoActionsService')
const { listShop, getItem, buyItem, sellItem, giveItem } = require('../../systems/items/itemsService')
const { jobsCatalog, setJob, getProfile, doWork, nextLevelXp } = require('../../systems/jobs/jobsService')
const { notImplemented } = require('../../core/commands/stubHandlers')

function dateKeyUTC (d = new Date()) {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function isYesterdayUTC (aKey, bKey) {
  if (!aKey || !bKey) return false
  const a = new Date(aKey + 'T00:00:00Z').getTime()
  const b = new Date(bKey + 'T00:00:00Z').getTime()
  return a - b === 24 * 60 * 60 * 1000
}

function clamp (n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}

module.exports = createSystemSlashCommand({
  name: 'eco',
  description: 'Economía completa (tipo Dank Memer, base escalable)',
  moduleKey: 'economy',
  defaultCooldownMs: 1_500,
  groups: [
    {
      name: 'money',
      description: 'Wallet/bank/transacciones',
      subcommands: [
        {
          name: 'balance',
          description: 'Balance (wallet + bank)',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario (opcional)').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('user') || interaction.user
            const b = await getBalances(client, user.id)
            const embed = new EmbedBuilder()
              .setTitle(`💰 Balance de ${user.username}`)
              .setColor('Green')
              .addFields(
                { name: 'Wallet', value: String(b.money), inline: true },
                { name: 'Banco', value: String(b.bank), inline: true }
              )
              .setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        },
        {
          name: 'pay',
          description: 'Paga a otro usuario',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Destino').setRequired(true)).addIntegerOption(o => o.setName('amount').setDescription('Cantidad').setRequired(true).setMinValue(1)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 4_000,
          handler: async (client, interaction) => {
            const target = interaction.options.getUser('user', true)
            const amount = interaction.options.getInteger('amount', true)
            if (target.bot) return interaction.reply({ content: 'No puedes pagar a bots.', ephemeral: true })
            await transfer({ client, guildID: interaction.guild.id, actorID: interaction.user.id, fromUserID: interaction.user.id, toUserID: target.id, amount })
            return interaction.reply({ content: `✅ Pagaste **${amount}** a <@${target.id}>.`, ephemeral: true })
          }
        },
        {
          name: 'deposit',
          description: 'Deposita al banco',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('amount').setDescription('Cantidad').setRequired(true).setMinValue(1)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const amount = interaction.options.getInteger('amount', true)
            await deposit({ client, guildID: interaction.guild.id, actorID: interaction.user.id, userID: interaction.user.id, amount })
            return interaction.reply({ content: `✅ Depositaste **${amount}** al banco.`, ephemeral: true })
          }
        },
        {
          name: 'withdraw',
          description: 'Retira del banco',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('amount').setDescription('Cantidad').setRequired(true).setMinValue(1)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const amount = interaction.options.getInteger('amount', true)
            await withdraw({ client, guildID: interaction.guild.id, actorID: interaction.user.id, userID: interaction.user.id, amount })
            return interaction.reply({ content: `✅ Retiraste **${amount}** del banco.`, ephemeral: true })
          }
        },
        {
          name: 'wallet',
          description: 'Muestra tu wallet',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const b = await getBalances(client, interaction.user.id)
            return interaction.reply({ content: `Wallet: **${b.money}**`, ephemeral: true })
          }
        },
        {
          name: 'bank',
          description: 'Muestra tu banco',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const b = await getBalances(client, interaction.user.id)
            return interaction.reply({ content: `Banco: **${b.bank}**`, ephemeral: true })
          }
        },
        {
          name: 'fine',
          description: 'Admin: multa',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)).addIntegerOption(o => o.setName('amount').setDescription('Cantidad').setRequired(true).setMinValue(1)).addStringOption(o => o.setName('reason').setDescription('Razón (opcional)').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.ECONOMY_ADMIN] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('user', true)
            const amount = interaction.options.getInteger('amount', true)
            await fine({ client, guildID: interaction.guild.id, actorID: interaction.user.id, userID: user.id, amount })
            return interaction.reply({ content: `✅ Multa aplicada a <@${user.id}> por **${amount}**.`, ephemeral: true })
          }
        },
        {
          name: 'admin-set',
          description: 'Admin: setea wallet/bank',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)).addIntegerOption(o => o.setName('wallet').setDescription('Wallet (opcional)').setRequired(false).setMinValue(0)).addIntegerOption(o => o.setName('bank').setDescription('Banco (opcional)').setRequired(false).setMinValue(0)) }],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.ECONOMY_ADMIN] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('user', true)
            const wallet = interaction.options.getInteger('wallet')
            const bankValue = interaction.options.getInteger('bank')
            if (wallet === null && bankValue === null) return interaction.reply({ content: 'Debes indicar `wallet` y/o `bank`.', ephemeral: true })
            await adminSet({ client, guildID: interaction.guild.id, actorID: interaction.user.id, userID: user.id, money: wallet, bank: bankValue })
            return interaction.reply({ content: `✅ Actualizado <@${user.id}>.`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'rewards',
      description: 'Recompensas (daily/weekly/monthly)',
      subcommands: [
        {
          name: 'daily',
          description: 'Reclama daily (con streak)',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const user = await client.db.getUserData(interaction.user.id)
            const now = Date.now()
            const oneDay = 24 * 60 * 60 * 1000
            if (user.dailyCooldown && now - user.dailyCooldown < oneDay) {
              const remaining = Math.ceil((oneDay - (now - user.dailyCooldown)) / (60 * 60 * 1000))
              return interaction.reply({ content: `⏳ Debes esperar ${remaining} horas para volver a reclamar daily.`, ephemeral: true })
            }

            const today = dateKeyUTC()
            const last = user.dailyLastDateKey
            if (last === today) return interaction.reply({ content: 'Ya reclamaste tu daily hoy.', ephemeral: true })

            const streak = isYesterdayUTC(today, last) ? (Number(user.dailyStreak || 0) + 1) : 1
            const bonus = clamp(streak * 10, 0, 300)
            const base = Math.floor(Math.random() * 201) + 100
            const amount = base + bonus

            user.money = Number(user.money || 0) + amount
            user.dailyCooldown = now
            user.dailyStreak = streak
            user.dailyLastDateKey = today
            await user.save()

            return interaction.reply({ content: `✅ Daily: **${amount}** monedas. Streak: **${streak}**.`, ephemeral: true })
          }
        },
        {
          name: 'weekly',
          description: 'Reclama weekly',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const user = await client.db.getUserData(interaction.user.id)
            const now = Date.now()
            const oneWeek = 7 * 24 * 60 * 60 * 1000
            if (user.weeklyCooldown && now - user.weeklyCooldown < oneWeek) {
              const remaining = Math.ceil((oneWeek - (now - user.weeklyCooldown)) / (24 * 60 * 60 * 1000))
              return interaction.reply({ content: `⏳ Debes esperar ${remaining} días para volver a reclamar weekly.`, ephemeral: true })
            }
            const amount = Math.floor(Math.random() * 801) + 700
            user.money = Number(user.money || 0) + amount
            user.weeklyCooldown = now
            await user.save()
            return interaction.reply({ content: `✅ Weekly: **${amount}** monedas.`, ephemeral: true })
          }
        },
        {
          name: 'monthly',
          description: 'Reclama monthly',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const user = await client.db.getUserData(interaction.user.id)
            const now = Date.now()
            const oneMonth = 30 * 24 * 60 * 60 * 1000
            if (user.monthlyCooldown && now - user.monthlyCooldown < oneMonth) {
              const remaining = Math.ceil((oneMonth - (now - user.monthlyCooldown)) / (24 * 60 * 60 * 1000))
              return interaction.reply({ content: `⏳ Debes esperar ${remaining} días para volver a reclamar monthly.`, ephemeral: true })
            }
            const amount = Math.floor(Math.random() * 3001) + 2000
            user.money = Number(user.money || 0) + amount
            user.monthlyCooldown = now
            await user.save()
            return interaction.reply({ content: `✅ Monthly: **${amount}** monedas.`, ephemeral: true })
          }
        },
        {
          name: 'claim',
          description: 'Claim all (daily/weekly/monthly disponibles)',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            // Implementación simple: intenta los 3 y acumula lo que se pueda.
            const user = await client.db.getUserData(interaction.user.id)
            const now = Date.now()
            let total = 0
            const logs = []

            // daily
            const oneDay = 24 * 60 * 60 * 1000
            if (!user.dailyCooldown || now - user.dailyCooldown >= oneDay) {
              const today = dateKeyUTC()
              const last = user.dailyLastDateKey
              if (last !== today) {
                const streak = isYesterdayUTC(today, last) ? (Number(user.dailyStreak || 0) + 1) : 1
                const bonus = clamp(streak * 10, 0, 300)
                const base = Math.floor(Math.random() * 201) + 100
                const amount = base + bonus
                total += amount
                user.dailyCooldown = now
                user.dailyStreak = streak
                user.dailyLastDateKey = today
                logs.push(`daily: +${amount} (streak ${streak})`)
              }
            }

            // weekly
            const oneWeek = 7 * 24 * 60 * 60 * 1000
            if (!user.weeklyCooldown || now - user.weeklyCooldown >= oneWeek) {
              const amount = Math.floor(Math.random() * 801) + 700
              total += amount
              user.weeklyCooldown = now
              logs.push(`weekly: +${amount}`)
            }

            // monthly
            const oneMonth = 30 * 24 * 60 * 60 * 1000
            if (!user.monthlyCooldown || now - user.monthlyCooldown >= oneMonth) {
              const amount = Math.floor(Math.random() * 3001) + 2000
              total += amount
              user.monthlyCooldown = now
              logs.push(`monthly: +${amount}`)
            }

            if (total <= 0) return interaction.reply({ content: 'No hay recompensas disponibles ahora mismo.', ephemeral: true })
            user.money = Number(user.money || 0) + total
            await user.save()
            return interaction.reply({ content: `✅ Claim all: **${total}** monedas.\n${logs.map(l => `- ${l}`).join('\n')}`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'shop',
      description: 'Tienda (catálogo + buy/sell)',
      subcommands: [
        {
          name: 'list',
          description: 'Lista items',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('buscar').setDescription('Filtro (opcional)').setRequired(false)) }],
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
          name: 'info',
          description: 'Info de item',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('item').setDescription('ID').setRequired(true).setAutocomplete(true)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const itemId = interaction.options.getString('item', true)
            const it = await getItem(itemId)
            if (!it) return interaction.reply({ content: 'Item inválido.', ephemeral: true })
            const embed = new EmbedBuilder()
              .setTitle(`🧳 ${it.name} (${it.itemId})`)
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
          description: 'Compra item',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('item').setDescription('ID').setRequired(true).setAutocomplete(true)).addIntegerOption(o => o.setName('qty').setDescription('Cantidad').setRequired(false).setMinValue(1).setMaxValue(100)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 3_000,
          handler: async (client, interaction) => {
            const itemId = interaction.options.getString('item', true)
            const qty = interaction.options.getInteger('qty') || 1
            const res = await buyItem({ client, guildID: interaction.guild.id, userID: interaction.user.id, itemId, qty })
            return interaction.reply({ content: `✅ Compraste **${res.qty}x** \`${res.item.itemId}\` por **$${res.total}**.`, ephemeral: true })
          }
        },
        {
          name: 'sell',
          description: 'Vende item',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('item').setDescription('ID').setRequired(true).setAutocomplete(true)).addIntegerOption(o => o.setName('qty').setDescription('Cantidad').setRequired(false).setMinValue(1).setMaxValue(100)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 3_000,
          handler: async (client, interaction) => {
            const itemId = interaction.options.getString('item', true)
            const qty = interaction.options.getInteger('qty') || 1
            const res = await sellItem({ client, guildID: interaction.guild.id, userID: interaction.user.id, itemId, qty })
            return interaction.reply({ content: `✅ Vendiste **${res.qty}x** \`${res.item.itemId}\` por **$${res.total}**.`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'inventory',
      description: 'Inventario (show/gift)',
      subcommands: [
        {
          name: 'show',
          description: 'Muestra tu inventario',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario (opcional)').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('user') || interaction.user
            const data = await client.db.getUserData(user.id)
            const inv = Array.isArray(data.inventory) ? data.inventory : []
            if (!inv.length) return interaction.reply({ content: 'Inventario vacío.', ephemeral: true })
            const lines = inv.slice(0, 25).map(x => `- \`${x.itemId}\` x**${x.qty}**`)
            const embed = new EmbedBuilder().setTitle(`🎒 Inventario de ${user.username}`).setColor('Blurple').setDescription(lines.join('\n')).setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        },
        {
          name: 'gift',
          description: 'Regala un item',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Destino').setRequired(true)).addStringOption(o => o.setName('item').setDescription('ID').setRequired(true).setAutocomplete(true)).addIntegerOption(o => o.setName('qty').setDescription('Cantidad').setRequired(false).setMinValue(1).setMaxValue(100)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 4_000,
          handler: async (client, interaction) => {
            const target = interaction.options.getUser('user', true)
            const itemId = interaction.options.getString('item', true)
            const qty = interaction.options.getInteger('qty') || 1
            if (target.bot) return interaction.reply({ content: 'No puedes regalar a bots.', ephemeral: true })
            const res = await giveItem({ fromUserID: interaction.user.id, toUserID: target.id, itemId, qty })
            return interaction.reply({ content: `✅ Regalo enviado: **${res.qty}x** \`${res.item.itemId}\` a <@${target.id}>.`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'jobs',
      description: 'Trabajos (work + perfil)',
      subcommands: [
        {
          name: 'list',
          description: 'Lista trabajos',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const lines = jobsCatalog.map(j => `- \`${j.id}\` **${j.name}** (CD: ${Math.floor((j.cooldownMs || 0) / 60000)}m)`)
            return interaction.reply({ content: `**Trabajos**\n${lines.join('\n')}`, ephemeral: true })
          }
        },
        {
          name: 'work',
          description: 'Trabaja (usa tu trabajo asignado)',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 2_000,
          handler: async (client, interaction) => {
            const res = await doWork({ client, guildID: interaction.guild.id, userID: interaction.user.id })
            const msg = [
              `✅ Ganaste **${res.amount}** monedas como **${res.job.name}**.`,
              `+XP Job: **${res.xpGain}**${res.leveledUp ? ' (¡subiste de nivel!)' : ''}`
            ].join('\n')
            return interaction.reply({ content: msg, ephemeral: true })
          }
        },
        {
          name: 'apply',
          description: 'Elige tu trabajo',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('job').setDescription('ID del trabajo').setRequired(true).setAutocomplete(true)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 5_000,
          handler: async (client, interaction) => {
            const jobId = interaction.options.getString('job', true)
            await setJob({ guildID: interaction.guild.id, userID: interaction.user.id, jobId })
            return interaction.reply({ content: `✅ Trabajo asignado: \`${jobId}\`.`, ephemeral: true })
          }
        },
        {
          name: 'profile',
          description: 'Perfil de trabajo',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario (opcional)').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('user') || interaction.user
            const profile = await getProfile({ guildID: interaction.guild.id, userID: user.id })
            const needed = nextLevelXp(profile.jobLevel || 1)
            const embed = new EmbedBuilder()
              .setTitle(`🧑‍💼 Job Profile de ${user.username}`)
              .setColor('Blurple')
              .addFields(
                { name: 'Trabajo', value: profile.jobId ? `\`${profile.jobId}\`` : '*Sin trabajo*', inline: true },
                { name: 'Nivel', value: String(profile.jobLevel || 1), inline: true },
                { name: 'XP', value: `${profile.jobXp || 0}/${needed}`, inline: true }
              )
              .setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'actions',
      description: 'Acciones (beg/crime/hunt/fish/dig/postmeme)',
      subcommands: [
        {
          name: 'beg',
          description: 'Pide dinero',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 2_000,
          handler: async (client, interaction) => {
            const res = await doAction({
              client,
              guildID: interaction.guild.id,
              userID: interaction.user.id,
              actionKey: 'beg',
              cooldownMs: 30_000,
              successMin: 20,
              successMax: 120,
              failChance: 0.2,
              failFineMin: 0,
              failFineMax: 25
            })
            return interaction.reply({ content: res.ok ? `ƒo. Beg: +${res.amount}` : `ƒ?O Beg fallido${res.fine ? `, multa -${res.fine}` : ''}.`, ephemeral: true })
          }
        },
        {
          name: 'crime',
          description: 'Crimen (riesgo alto)',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 2_000,
          handler: async (client, interaction) => {
            const res = await doAction({
              client,
              guildID: interaction.guild.id,
              userID: interaction.user.id,
              actionKey: 'crime',
              cooldownMs: 2 * 60_000,
              successMin: 200,
              successMax: 800,
              failChance: 0.45,
              failFineMin: 80,
              failFineMax: 400
            })
            return interaction.reply({ content: res.ok ? `ƒo. Crime: +${res.amount}` : `ƒ?O Crime fallido${res.fine ? `, multa -${res.fine}` : ''}.`, ephemeral: true })
          }
        },
        {
          name: 'hunt',
          description: 'Caza',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const res = await doAction({ client, guildID: interaction.guild.id, userID: interaction.user.id, actionKey: 'hunt', cooldownMs: 90_000, successMin: 60, successMax: 240, failChance: 0.25, failFineMin: 0, failFineMax: 60 })
            return interaction.reply({ content: res.ok ? `ƒo. Hunt: +${res.amount}` : `ƒ?O Hunt fallido${res.fine ? `, multa -${res.fine}` : ''}.`, ephemeral: true })
          }
        },
        {
          name: 'fish',
          description: 'Pesca',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const res = await doAction({ client, guildID: interaction.guild.id, userID: interaction.user.id, actionKey: 'fish', cooldownMs: 75_000, successMin: 40, successMax: 200, failChance: 0.2, failFineMin: 0, failFineMax: 40 })
            return interaction.reply({ content: res.ok ? `ƒo. Fish: +${res.amount}` : `ƒ?O Fish fallido${res.fine ? `, multa -${res.fine}` : ''}.`, ephemeral: true })
          }
        },
        {
          name: 'dig',
          description: 'Cavar',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const res = await doAction({ client, guildID: interaction.guild.id, userID: interaction.user.id, actionKey: 'dig', cooldownMs: 110_000, successMin: 70, successMax: 300, failChance: 0.25, failFineMin: 0, failFineMax: 70 })
            return interaction.reply({ content: res.ok ? `ƒo. Dig: +${res.amount}` : `ƒ?O Dig fallido${res.fine ? `, multa -${res.fine}` : ''}.`, ephemeral: true })
          }
        },
        {
          name: 'postmeme',
          description: 'Postea un meme',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const res = await doAction({ client, guildID: interaction.guild.id, userID: interaction.user.id, actionKey: 'postmeme', cooldownMs: 2 * 60_000, successMin: 90, successMax: 350, failChance: 0.3, failFineMin: 0, failFineMax: 90 })
            return interaction.reply({ content: res.ok ? `ƒo. PostMeme: +${res.amount}` : `ƒ?O PostMeme fallido${res.fine ? `, multa -${res.fine}` : ''}.`, ephemeral: true })
          }
        },
        { name: 'gamble', description: 'Gamble (placeholder)', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: notImplemented('eco gamble') }
      ]
    },
    {
      name: 'stream',
      description: 'Stream (start/stop/stats)',
      subcommands: [
        {
          name: 'start',
          description: 'Inicia stream',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            await streamStart({ client, guildID: interaction.guild.id, userID: interaction.user.id })
            return interaction.reply({ content: 'ƒo. Stream iniciado. Usa `/eco stream stats` para cobrar.', ephemeral: true })
          }
        },
        {
          name: 'stop',
          description: 'Detiene stream',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const res = await streamStop({ client, guildID: interaction.guild.id, userID: interaction.user.id })
            return interaction.reply({ content: `ƒo. Stream detenido. Último cobro: +${res.earned}. Total: ${res.stream.totalEarned}`, ephemeral: true })
          }
        },
        {
          name: 'stats',
          description: 'Cobra y muestra stats',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const res = await streamCollect({ client, guildID: interaction.guild.id, userID: interaction.user.id })
            return interaction.reply({ content: `ƒo. Cobraste: +${res.earned}. Total acumulado: ${res.stream.totalEarned}`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'protect',
      description: 'Protección anti-rob',
      subcommands: [
        {
          name: 'buy',
          description: 'Compra protección (24h)',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const res = await buyProtect({ client, guildID: interaction.guild.id, userID: interaction.user.id })
            return interaction.reply({ content: `ƒo. Protección comprada por ${res.price}. Expira: <t:${Math.floor(res.until / 1000)}:R>.`, ephemeral: true })
          }
        },
        {
          name: 'status',
          description: 'Estado de protección',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const st = await protectStatus({ client, userID: interaction.user.id })
            return interaction.reply({ content: st.active ? `ƒo. Protección activa hasta <t:${Math.floor(st.until / 1000)}:R>.` : 'Protección inactiva.', ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'insurance',
      description: 'Insurance (base)',
      subcommands: [
        {
          name: 'buy',
          description: 'Compra insurance (24h)',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const res = await buyInsurance({ client, guildID: interaction.guild.id, userID: interaction.user.id })
            return interaction.reply({ content: `ƒo. Insurance comprada por ${res.price}. Expira: <t:${Math.floor(res.until / 1000)}:R>.`, ephemeral: true })
          }
        },
        {
          name: 'status',
          description: 'Estado de insurance',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const st = await insuranceStatus({ client, userID: interaction.user.id })
            return interaction.reply({ content: st.active ? `ƒo. Insurance activa hasta <t:${Math.floor(st.until / 1000)}:R>.` : 'Insurance inactiva.', ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'crime',
      description: 'Robos',
      subcommands: [
        {
          name: 'rob',
          description: 'Roba a un usuario',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Objetivo').setRequired(true)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const target = interaction.options.getUser('user', true)
            if (target.bot) return interaction.reply({ content: 'No puedes robar a bots.', ephemeral: true })
            const res = await robUser({ client, guildID: interaction.guild.id, robberID: interaction.user.id, targetID: target.id })
            if (res.ok) return interaction.reply({ content: `ƒo. Robaste **${res.amount}** a <@${target.id}>.`, ephemeral: true })
            if (res.reason === 'protect') return interaction.reply({ content: `ƒ?O Objetivo protegido. ${res.penalty ? `Multa -${res.penalty}.` : ''}`, ephemeral: true })
            if (res.reason === 'caught') return interaction.reply({ content: `ƒ?O Te atraparon. ${res.penalty ? `Multa -${res.penalty}.` : ''}`, ephemeral: true })
            if (res.reason === 'poor') return interaction.reply({ content: 'ƒ?O Ese usuario no tiene suficiente dinero para robar.', ephemeral: true })
            return interaction.reply({ content: 'ƒ?O El robo falló (intenta luego).', ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'leaderboard',
      description: 'Leaderboards económicos',
      subcommands: [
        {
          name: 'money',
          description: 'Top por wallet',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const rows = await UserSchema.find({}).sort({ money: -1 }).limit(10)
            const lines = rows.map((u, i) => `**${i + 1}.** <@${u.userID}> • ${u.money || 0}`)
            return interaction.reply({ content: `**Top Wallet (global)**\n${lines.join('\n')}`, ephemeral: true })
          }
        },
        {
          name: 'bank',
          description: 'Top por banco',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const rows = await UserSchema.find({}).sort({ bank: -1 }).limit(10)
            const lines = rows.map((u, i) => `**${i + 1}.** <@${u.userID}> • ${u.bank || 0}`)
            return interaction.reply({ content: `**Top Banco (global)**\n${lines.join('\n')}`, ephemeral: true })
          }
        },
        {
          name: 'networth',
          description: 'Top por networth (wallet + bank)',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const rows = await UserSchema.find({}).limit(200)
            const scored = rows
              .map(u => ({ id: u.userID, n: Number(u.money || 0) + Number(u.bank || 0) }))
              .sort((a, b) => b.n - a.n)
              .slice(0, 10)
            const lines = scored.map((u, i) => `**${i + 1}.** <@${u.id}> • ${u.n}`)
            return interaction.reply({ content: `**Top Networth (global)**\n${lines.join('\n')}`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'history',
      description: 'Historial económico',
      subcommands: [
        {
          name: 'user',
          description: 'Últimas transacciones de un usuario',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('user') || interaction.user
            const rows = await EconomyTransactionSchema.find({
              guildID: interaction.guild.id,
              $or: [{ fromUserID: user.id }, { toUserID: user.id }]
            }).sort({ createdAt: -1 }).limit(10)
            if (!rows.length) return interaction.reply({ content: 'No hay transacciones.', ephemeral: true })
            const lines = rows.map(r => `- \`${r.type}\` ${r.amount} • ${new Date(r.createdAt).toLocaleString()}`)
            return interaction.reply({ content: `**Historial de ${user.username}**\n${lines.join('\n')}`, ephemeral: true })
          }
        }
      ]
    }
  ],

  autocomplete: async (client, interaction) => {
    const focused = interaction.options.getFocused(true)
    const q = String(focused.value || '').toLowerCase()

    if (focused.name === 'job') {
      const out = jobsCatalog
        .filter(j => j.id.includes(q) || j.name.toLowerCase().includes(q))
        .slice(0, 25)
        .map(j => ({ name: `${j.name} (${j.id})`, value: j.id }))
      return interaction.respond(out)
    }

    if (focused.name === 'item') {
      const items = await listShop({ query: q })
      const out = items.slice(0, 25).map(it => ({ name: `${it.name} (${it.itemId})`, value: it.itemId }))
      return interaction.respond(out)
    }

    return interaction.respond([])
  }
})
