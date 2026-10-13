const express = require('express')
const { PermissionFlagsBits } = require('discord.js')
const { AssetError, SLOTS } = require('../handlers/card-assets')
const { MAX_IMAGE_BYTES } = require('../handlers/card-media')
const { renderConfiguredWelcomeCard, renderConfiguredLeaveCard } = require('../handlers/cards')
const { renderWelcomeMessage } = require('../handlers/welcome-message')
const { welcomeMessage } = require('../handlers/config-service')

module.exports = (app, client, { requireAuth, requireFreshGuildPermissions, canManageGuild }) => {
  let uploads = 0
  const code = error => error instanceof AssetError ? error.code : 'asset_storage'
  const respond = (res, error) => {
    const name = error.type === 'entity.too.large' ? 'asset_too_large' : code(error)
    const status = { invalid_asset_request: 400, invalid_card_image: 422, asset_permissions: 403, asset_not_found: 404,
      asset_conflict: 409, asset_in_use: 409, asset_limit: 409, asset_too_large: 413, asset_request_cancelled: 409 }[name] || 503
    return res.status(status).json({ error: name })
  }
  const wrap = handler => async (req, res) => {
    try { await handler(req, res) } catch (error) { if (!res.destroyed && !res.headersSent) respond(res, error) }
    finally { req.releaseCardUpload?.() }
  }
  async function actor(req) {
    const guild = client.guilds.cache.get(req.params.guildId)
    if (!guild || !canManageGuild(req.session.user, guild.id)) throw new AssetError('asset_permissions')
    const member = await guild.members.fetch({ user: req.session.user.id, force: true }).catch(() => null)
    if (!member || member.id !== req.session.user.id || member.guild?.id !== guild.id || !member.permissions.has(PermissionFlagsBits.ManageGuild)) throw new AssetError('asset_permissions')
    return member
  }
  const access = async (req, res, next) => {
    res.set('Cache-Control', 'private, no-store')
    if (!client.guilds.cache.has(req.params.guildId)) return res.status(404).json({ error: 'guild_not_found' })
    if (!client.cardAssets || client._shuttingDown) return res.status(503).json({ error: 'asset_storage' })
    try { req.cardActor = await actor(req); next() } catch (error) { respond(res, error) }
  }
  const guarded = [requireAuth, requireFreshGuildPermissions, access]
  const fields = (value, allowed) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== allowed.length || Object.keys(value).some(key => !allowed.includes(key))) throw new AssetError('invalid_asset_request')
  }
  app.get('/cards/:guildId', ...guarded, (req, res) => res.render('pages/cards', {
    user: req.session.user, guild: { id: req.params.guildId, name: req.cardActor.guild.name },
  }))
  app.get('/api/cards/:guildId', ...guarded, wrap(async (req, res) => res.json(await client.cardAssets.list(req.params.guildId))))
  app.get('/api/cards/:guildId/assets/:assetId', ...guarded, wrap(async (req, res) => {
    const buffer = await client.cardAssets.image(req.params.guildId, req.params.assetId)
    res.set('X-Content-Type-Options', 'nosniff').set('Content-Disposition', 'inline; filename="card-background.png"').type('png').send(buffer)
  }))
  const uploadGate = (req, res, next) => {
    if (req.get('content-type') !== 'application/octet-stream' || req.get('content-encoding') && req.get('content-encoding') !== 'identity') return res.status(400).json({ error: 'invalid_asset_request' })
    if (Number(req.get('content-length')) > MAX_IMAGE_BYTES) return res.status(413).json({ error: 'asset_too_large' })
    if (uploads >= 2) return res.status(503).json({ error: 'asset_busy' })
    uploads++; let released = false
    const release = () => { if (!released) { released = true; uploads-- } }
    req.releaseCardUpload = release
    res.once('finish', release)
    const parser = express.raw({ type: 'application/octet-stream', limit: MAX_IMAGE_BYTES, inflate: false })
    const timer = setTimeout(() => { release(); res.status(408).json({ error: 'asset_request_cancelled' }); req.destroy() }, 10000)
    res.once('close', () => clearTimeout(timer)); res.once('finish', () => clearTimeout(timer))
    parser(req, res, error => { clearTimeout(timer); if (error) { release(); if (!res.destroyed) respond(res, error) } else next() })
  }
  app.post('/api/cards/:guildId/assets', ...guarded, uploadGate, wrap(async (req, res) => {
    const query = req.query
    fields(query, ['name', 'revision'])
    const result = await client.cardAssets.upload(req.params.guildId, req.session.user.id, query.name, req.body, query.revision, async () => {
      if (req.aborted || res.destroyed || client._shuttingDown) throw new AssetError('asset_request_cancelled')
      await actor(req)
    })
    res.status(201).json(result)
  }))
  app.put('/api/cards/:guildId/selection', ...guarded, wrap(async (req, res) => {
    fields(req.body, ['slot', 'assetId', 'revision'])
    res.json(await client.cardAssets.choose(req.params.guildId, req.body.slot, req.body.assetId, req.body.revision))
  }))
  app.delete('/api/cards/:guildId/assets/:assetId', ...guarded, wrap(async (req, res) => {
    fields(req.body, ['revision'])
    res.json(await client.cardAssets.remove(req.params.guildId, req.params.assetId, req.body.revision))
  }))
  app.post('/api/cards/:guildId/preview', ...guarded, wrap(async (req, res) => {
    fields(req.body, ['slot', 'assetId', 'name'])
    const { slot, assetId, name } = req.body
    if (!SLOTS.includes(slot) || typeof name !== 'string' || name.length > 120 || typeof assetId !== 'string' && assetId !== null) throw new AssetError('invalid_asset_request')
    if (assetId !== null && assetId !== 'legacy' && !(await client.cardAssets.list(req.params.guildId)).assets.some(asset => asset.id === assetId)) throw new AssetError('asset_not_found')
    const kind = slot.startsWith('welcome') ? 'welcome' : 'leave', dm = slot.endsWith('Dm')
    const member = { guild: req.cardActor.guild, user: {
      username: name || 'Miembro de ejemplo', discriminator: '0',
      displayAvatarURL: options => req.cardActor.user?.displayAvatarURL?.(options) || null,
      toString: () => '@' + (name || 'Miembro de ejemplo'),
    } }
    const assets = { background: async () => assetId === 'legacy' ? { managed: false } : { managed: true, buffer: assetId === null ? null : await client.cardAssets.image(req.params.guildId, assetId) } }
    const raw = kind === 'welcome' ? dm ? client.settings.get(req.params.guildId, 'welcome.dm_msg') : welcomeMessage(client.settings, req.params.guildId) : client.settings.get(req.params.guildId, `leave.${dm ? 'dm_msg' : 'msg'}`)
    const text = renderWelcomeMessage(raw || (kind === 'welcome' ? 'Bienvenido {user} a {guild}' : 'Hasta pronto {user}'), member.user, member.guild)
    let image = null, warning = null
    try { image = (await (kind === 'welcome' ? renderConfiguredWelcomeCard : renderConfiguredLeaveCard)(client.settings, member, { dm, assets })).toString('base64') }
    catch (error) { if (error instanceof AssetError) throw error; warning = 'preview_unavailable' }
    await actor(req)
    if (client._shuttingDown || req.aborted) throw new AssetError('asset_request_cancelled')
    res.json({ image, text, warning, slot, preview: true })
  }))
}
