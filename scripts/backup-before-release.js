#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { createHash } = require('node:crypto')
const { projectGlobalConfiguration, readGlobalConfiguration } = require('../handlers/global-configuration')
const root = path.resolve(__dirname, '..')
const values = require('dotenv').parse(fs.readFileSync(path.join(root, '.env')))
const uri = values.MONGO_URL || values.mongourl
if (!uri) throw new Error('Missing MongoDB configuration')
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const directory = path.join('/home/backups/obey-releases', stamp)
fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
for (const name of ['.env', 'docker-compose.yml', 'docker-compose.override.yml', 'lavalink/application.yml']) {
  const destination = path.join(directory, path.basename(name))
  fs.copyFileSync(path.join(root, name), destination)
  fs.chmodSync(destination, 0o600)
}
const persisted = path.join(root, '.runtime/global-configuration')
const documents = fs.existsSync(persisted) ? readGlobalConfiguration(persisted, { allowMissingStatus: true }) : projectGlobalConfiguration({
  'config.json': require('../botconfig/config.json'), 'advertisement.json': require('../botconfig/advertisement.json'),
})
const configurationBackup = path.join(directory, 'global-configuration')
fs.mkdirSync(configurationBackup, { mode: 0o700 })
const hashes = {}
for (const [name, document] of Object.entries(documents)) {
  const raw = JSON.stringify(document, null, 2) + '\n'
  fs.writeFileSync(path.join(configurationBackup, name), raw, { flag: 'wx', mode: 0o600 })
  hashes[name] = createHash('sha256').update(raw).digest('hex')
}
fs.writeFileSync(path.join(directory, 'global-configuration-manifest.json'), JSON.stringify({ source: fs.existsSync(persisted) ? 'persistent' : 'image-defaults', hashes }, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
const archive = path.join(directory, 'mongo.archive.gz')
const out = fs.openSync(archive, 'wx', 0o600)
const errorLog = fs.openSync(path.join(directory, 'backup-error.log'), 'wx', 0o600)
const dumpConfig = path.join(directory, 'mongodump.yml')
fs.writeFileSync(dumpConfig, `uri: ${JSON.stringify(uri)}\n`, { flag: 'wx', mode: 0o600 })
const childEnv = { ...process.env }
delete childEnv.MONGO_URL
delete childEnv.mongourl
const child = spawn('podman', ['run', '--rm', '--network', 'host', '--volume', `${dumpConfig}:/run/mongodump.yml:ro`,
  '--entrypoint', 'mongodump', 'docker.io/library/mongo:7', '--config=/run/mongodump.yml', '--archive', '--gzip', '--quiet'], {
  env: childEnv, stdio: ['ignore', out, errorLog],
})
child.on('error', () => { /* The close handler reports a failed backup without exposing process details. */ })
child.on('close', code => {
  fs.closeSync(out); fs.closeSync(errorLog)
  fs.rmSync(dumpConfig, { force: true })
  if (code || !fs.statSync(archive).size) { console.error('Backup failed; private error log retained at', directory); process.exitCode = 1; return }
  console.log(JSON.stringify({ backup: directory, bytes: fs.statSync(archive).size }))
})
