const { EmbedBuilder, PermissionFlagsBits: F, escapeMarkdown } = require('discord.js')
const { createSetupSettings } = require('./setup-settings')
const { requireSetupAccess } = require('./setup-access')
const { checkResources } = require('./setup-form')
const { setupFailureNotice } = require('./setup-errors')
const { t, localeFor } = require('./i18n')

async function configureRoles(client, interaction, kind) {
  const locale = localeFor(client, interaction.guild.id), copy = (key, variables) => t(locale, `setup.roleConfiguration.${key}`, variables)
  const context = { guildId: interaction.guild.id, actorId: interaction.user.id, channelId: interaction.channelId,
    actorPermission: kind === 'admin' ? F.Administrator : F.ManageGuild }
  await interaction.deferReply({ ephemeral: true })
  const notice = key => ({ content: copy(key), embeds: [], components: [], allowedMentions: { parse: [] } })
  try {
    const action = interaction.options.getString('accion')
    if (!['admin', 'autorole'].includes(kind) || !['list', 'add', 'remove', ...(kind === 'autorole' ? ['clear'] : [])].includes(action))
      return interaction.editReply(notice('invalid'))
    await requireSetupAccess(client, context)
    const definition = kind === 'admin' ? require('./setup-role-settings').adminDefinition(client) : require('./setup-membership').definition('welcome', 'general')
    const key = kind === 'admin' ? 'general' : 'roles', field = definition.fields[key]
    const service = createSetupSettings(client.settings, definition.fields, () => Boolean(client._shuttingDown || client._dbReady === false), definition.defaults)
    const before = await service.read(context.guildId), roles = before.values[key]
    if (!Array.isArray(roles)) throw Object.assign(new Error('setup_storage'), { code: 'setup_storage' })
    let next = [...roles]
    if (action !== 'list') {
      const role = interaction.options.getRole('rol')
      if (action !== 'clear' && (!role || typeof role.id !== 'string' || !/^\d{17,20}$/.test(role.id)))
        return interaction.editReply(notice('invalid'))
      const access = await requireSetupAccess(client, context)
      // New grants use the exact field/resource policy of the existing setup.
      // Removing stale roles and clearing the list never need a new role grant.
      if (action === 'add') {
        await checkResources(access, field, [role.id])
        if (!next.includes(role.id)) next.push(role.id)
      } else if (action === 'remove') next = next.filter(id => id !== role.id)
      else next = []
      await service.save(context.guildId, { [key]: next }, before.revision)
    }
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
      .setTitle(copy(action === 'list' ? kind === 'admin' ? 'adminTitle' : 'autoroleTitle' : 'saved'))
      .setDescription(next.length ? next.slice(0, 20).map(id => /^\d{17,20}$/.test(String(id))
        ? `<@&${id}>` : `\`${escapeMarkdown(String(id)).slice(0, 100)}\``).join('\n') : copy('empty'))
      .setFooter({ text: copy('count', { count: next.length }) })], allowedMentions: { parse: [] } })
  } catch (error) {
    const key = error.code === 'setup_conflict' ? 'conflict' : 'unavailable'
    const fallback = notice(error.message === 'setup_resource' ? 'resource' : key)
    return interaction.editReply(setupFailureNotice(locale, error, fallback, 'configuration/roles'))
  }
}

module.exports = { configureRoles }
