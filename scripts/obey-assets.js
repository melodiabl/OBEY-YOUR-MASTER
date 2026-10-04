#!/usr/bin/env node
const fs = require('node:fs/promises')
const path = require('node:path')
const { REST, Routes } = require('discord.js')
const { validateAssets, planEmojiSync, syncEmojis } = require('../handlers/assets/emoji-pipeline')
const { snowflake } = require('../handlers/assets/registry')
async function main() {
  const args = process.argv.slice(2)
  if (args.some(arg => arg !== '--apply' && !arg.startsWith('--keys='))) throw new Error('Use --apply and/or --keys=play,pause,...')
  const keysArgument = args.find(arg => arg.startsWith('--keys='))
  const assets = await validateAssets(keysArgument ? keysArgument.slice(7).split(',') : undefined)
  if (!args.includes('--apply')) {
    console.log(JSON.stringify({ mode: 'validate-only', count: assets.length, plan: planEmojiSync(assets, []).map(({ key, name, bytes, width, height, sha256, action }) => ({ key, name, bytes, width, height, sha256, action })) }, null, 2))
    return
  }
  const applicationId = process.env.DISCORD_CLIENT_ID
  const token = process.env.BOT_TOKEN || process.env.token
  if (!snowflake(applicationId) || !token) throw new Error('Set DISCORD_CLIENT_ID and BOT_TOKEN in the environment')
  const file = path.resolve(process.env.OBEY_EMOJI_MAP_FILE || path.join(__dirname, '../assets/obey/application-emojis.json'))
  await fs.mkdir(path.dirname(file), { recursive: true })
  const lockFile = file + '.lock'
  const lock = await fs.open(lockFile, 'wx', 0o600)
  let temporary
  try {
    let previous = {}
    try { previous = JSON.parse(await fs.readFile(file, 'utf8')) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
    const rest = new REST({ version: '10', retries: 0 }).setToken(token)
    const route = Routes.applicationEmojis(applicationId)
    const adapter = {
      list: async () => { const result = await rest.get(route); return result.items },
      create: async (name, buffer) => rest.post(route, { body: { name, image: `data:image/png;base64,${buffer.toString('base64')}` } }),
    }
    const save = async map => {
      temporary = `${file}.${process.pid}.tmp`
      await fs.writeFile(temporary, JSON.stringify(map, null, 2) + '\n', { mode: 0o600 })
      await fs.rename(temporary, file)
      temporary = null
    }
    const result = await syncEmojis({ assets, applicationId, adapter, save, previous })
    console.log(JSON.stringify({ mode: 'applied', count: assets.length, mapped: Object.keys(result.emojis).length, file }, null, 2))
  } finally {
    if (temporary) await fs.unlink(temporary).catch(() => {})
    await lock.close()
    await fs.unlink(lockFile)
  }
}
main().catch(error => {
  // REST errors may contain request bodies or headers. Never print them.
  console.error('[Assets] Validation/sync failed:', error.name, error.code || 'invalid_input_or_sync_failed')
  process.exitCode = 1
})
