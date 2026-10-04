#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
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
const archive = path.join(directory, 'mongo.archive.gz')
const out = fs.openSync(archive, 'wx', 0o600)
const errorLog = fs.openSync(path.join(directory, 'backup-error.log'), 'wx', 0o600)
const child = spawn('podman', ['run', '--rm', '--network', 'host', '-e', 'MONGO_URL', 'docker.io/library/mongo:7', 'sh', '-c', 'exec mongodump --uri="$MONGO_URL" --archive --gzip --quiet'], {
  env: { ...process.env, MONGO_URL: uri }, stdio: ['ignore', out, errorLog],
})
child.on('close', code => {
  fs.closeSync(out); fs.closeSync(errorLog)
  if (code || !fs.statSync(archive).size) { console.error('Backup failed; private error log retained at', directory); process.exitCode = 1; return }
  console.log(JSON.stringify({ backup: directory, bytes: fs.statSync(archive).size }))
})
