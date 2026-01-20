const { resolveInternalIdentity } = require('../../core/auth/resolveInternalIdentity')
const { authorizeInternal } = require('../../core/auth/authorize')
const { audit } = require('../../core/audit/auditService')
const TTLCache = require('../../core/cache/ttlCache')

const globalCooldownCache = new TTLCache({ defaultTtlMs: 5_000, maxSize: 200_000 })

function globalCooldownKey (guildId, userId) {
  return `${guildId}:${userId}`
}

module.exports = async (client, interaction) => {
  const reply = async (payload) => {
    if (interaction.deferred || interaction.replied) {
      return await interaction.editReply(payload).catch(() => {})
    }
    return await interaction.reply(payload).catch(() => {})
  }

  try {
    if (!interaction.guild || !interaction.channel) return

    // Manejo de Menús de Selección
    if (interaction.isStringSelectMenu?.()) {
      if (interaction.customId === 'help_menu') {
        const category = interaction.values[0]
        const commands = client.slashCommands.filter(c => c.CATEGORY === category)

        const { EmbedBuilder } = require('discord.js')
        const Emojis = require('../../utils/emojis')
        const Format = require('../../utils/formatter')

        const embed = new EmbedBuilder()
          .setTitle(`${Emojis.info} Comandos de ${category}`)
          .setDescription(commands.map(c => `**/${c.CMD.name}**: ${c.CMD.description}`).join('\n') || 'No hay comandos en esta categoría.')
          .setColor('Blurple')
          .setTimestamp()

        return await interaction.update({ embeds: [embed] })
      }
    }

    // Autocomplete: enrutar al comando si lo soporta.
    if (interaction.isAutocomplete?.()) {
      const cmd = client.slashCommands.get(interaction.commandName)
      if (cmd?.autocomplete) {
        try {
          return await cmd.autocomplete(client, interaction)
        } catch (e) {
          return
        }
      }
      return
    }

    if (!interaction.isChatInputCommand?.()) return

    // Compat: algunos comandos todavía usan GUILD_DATA del JsonDB.
    const GUILD_DATA = client.dbGuild.getGuildData(interaction.guild.id)

    const COMANDO = client.slashCommands.get(interaction.commandName)
    if (!COMANDO) return

    if (COMANDO.DEFER) {
      await interaction.deferReply({ ephemeral: COMANDO.EPHEMERAL || false }).catch(() => {})
    }

    // Cooldown global por servidor (anti-abuso base).
    const guildMongo = await client.db.getGuildData(interaction.guild.id)
    try {
      const ms = Number(guildMongo?.globalCooldownMs || 0)
      if (ms > 0) {
        const key = globalCooldownKey(interaction.guild.id, interaction.user.id)
        const until = globalCooldownCache.get(key)
        if (until && until > Date.now()) {
          const remaining = Math.ceil((until - Date.now()) / 1000)
          return reply({ content: `⏳ Espera **${remaining}s** antes de usar más comandos.`, ephemeral: true })
        }
        globalCooldownCache.set(key, Date.now() + ms, ms)
      }
    } catch (e) {}

    // OWNER (existente)
    if (COMANDO.OWNER) {
      if (!String(process.env.OWNER_IDS || '').split(' ').includes(interaction.user.id)) {
        return reply({
          content: `❌ **Solo los dueños de este bot pueden ejecutar este comando!**\n**Dueños del bot:** ${String(process.env.OWNER_IDS || '').split(' ').filter(Boolean).map(id => `<@${id}>`).join(' ')}`,
          ephemeral: true
        })
      }
    }

    // Permisos nativos Discord (existente)
    if (COMANDO.BOT_PERMISSIONS) {
      if (!interaction.guild.members.me.permissions.has(COMANDO.BOT_PERMISSIONS)) {
        return reply({
          content: `❌ **No tengo suficientes permisos para ejecutar este comando!**\nNecesito los siguientes permisos ${COMANDO.BOT_PERMISSIONS.map(p => `\`${p}\``).join(', ')}`,
          ephemeral: true
        })
      }
    }

    if (COMANDO.PERMISSIONS) {
      if (!interaction.member.permissions.has(COMANDO.PERMISSIONS)) {
        return reply({
          content: `❌ **No tienes suficientes permisos para ejecutar este comando!**\nNecesitas los siguientes permisos ${COMANDO.PERMISSIONS.map(p => `\`${p}\``).join(', ')}`,
          ephemeral: true
        })
      }
    }

    // Validación interna (opcional): rol/permisos propios del bot.
    // Se activa solo si el comando exporta INTERNAL_ROLE y/o INTERNAL_PERMS.
    if (COMANDO.INTERNAL_ROLE || COMANDO.INTERNAL_PERMS) {
      const identity = await resolveInternalIdentity({
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        member: interaction.member
      })

      const authz = authorizeInternal({
        identity,
        requiredRole: COMANDO.INTERNAL_ROLE,
        requiredPerms: COMANDO.INTERNAL_PERMS
      })

      if (!authz.ok) {
        return reply({ content: `❌ ${authz.reason}`, ephemeral: true })
      }
    }

    // Módulos por servidor (opcional). Si no hay MODULE, no bloquea.
    if (COMANDO.MODULE) {
      try {
        // Evita auto-bloqueo: comandos críticos siempre deben poder ejecutarse.
        // (si deshabilitas "config" o "security", necesitas poder re-habilitarlo).
        const alwaysAllowedCommands = new Set(['modules', 'auth', 'security', 'config'])
        if (alwaysAllowedCommands.has(interaction.commandName)) {
          // no-op
        } else {
          const modules = guildMongo?.modules
          const isOff = modules?.get ? modules.get(COMANDO.MODULE) === false : modules?.[COMANDO.MODULE] === false
          if (isOff) {
            return reply({ content: `❌ El módulo \`${COMANDO.MODULE}\` está deshabilitado en este servidor.`, ephemeral: true })
          }
        }
      } catch (e) {}
    }

    const startedAt = Date.now()
    try {
      await COMANDO.execute(client, interaction, '/', GUILD_DATA)
      await audit({
        client,
        guild: interaction.guild,
        payload: {
          guildID: interaction.guild.id,
          actorID: interaction.user.id,
          action: `slash.${interaction.commandName}`,
          ok: true,
          createdAt: new Date(),
          meta: {
            commandName: interaction.commandName,
            durationMs: Date.now() - startedAt
          }
        }
      })
    } catch (e) {
      const msg = e?.message || String(e || 'Error desconocido')

      // Respuesta segura al usuario.
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: `❌ Error al ejecutar \`/${interaction.commandName}\`: ${msg}`, ephemeral: true })
        } else {
          await interaction.reply({ content: `❌ Error al ejecutar \`/${interaction.commandName}\`: ${msg}`, ephemeral: true })
        }
      } catch (_) {}

      await audit({
        client,
        guild: interaction.guild,
        payload: {
          guildID: interaction.guild.id,
          actorID: interaction.user.id,
          action: `slash.${interaction.commandName}`,
          ok: false,
          createdAt: new Date(),
          meta: {
            commandName: interaction.commandName,
            error: msg
          }
        }
      })
      console.log(e)
    }
  } catch (e) {
    console.log(e)
  }
}
