#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execFileSync } = require('node:child_process')
const { projectGlobalConfiguration, readGlobalConfiguration } = require('../handlers/global-configuration')
const root = path.resolve(__dirname, '..'), destination = path.join(root, '.runtime/global-configuration')

function initialize() {
  const args = process.argv.slice(2)
  if (args.length && (args.length !== 2 || args[0] !== '--from-container' || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/.test(args[1]))) throw Error('invalid_arguments')
  if (fs.existsSync(destination)) { readGlobalConfiguration(destination); return { initialized: false, existingValidated: true } }
  if (!args.length && process.env.OBEY_GLOBAL_CONFIG_DIR !== undefined) throw Error('source_container_required')
  if (args.length && execFileSync('podman', ['inspect', '--format', '{{.State.Running}}', args[1]], { encoding: 'utf8', stdio: 'pipe' }).trim() !== 'false') throw Error('source_container_running')
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 })
  const source = fs.mkdtempSync(path.join(os.tmpdir(), 'obey-global-config-'))
  const staging = fs.mkdtempSync(path.join(path.dirname(destination), '.global-configuration-'))
  try {
    const documents = {}
    for (const name of ['config.json', 'advertisement.json']) {
      let file = path.join(root, 'botconfig', name)
      if (args.length) {
        file = path.join(source, name)
        execFileSync('podman', ['cp', `${args[1]}:/app/botconfig/${name}`, file], { stdio: 'pipe' })
      }
      documents[name] = JSON.parse(fs.readFileSync(file, 'utf8'))
    }
    for (const [name, document] of Object.entries(projectGlobalConfiguration(documents))) {
      const file = path.join(staging, name), fd = fs.openSync(file, 'wx', 0o600)
      try { fs.writeFileSync(fd, JSON.stringify(document, null, 2) + '\n'); fs.fsyncSync(fd) }
      finally { fs.closeSync(fd) }
      if (process.getuid?.() === 0) fs.chownSync(file, 1000, 1000)
    }
    readGlobalConfiguration(staging)
    if (process.getuid?.() === 0) fs.chownSync(staging, 1000, 1000)
    fs.renameSync(staging, destination)
    return { initialized: true, files: 2 }
  } finally {
    fs.rmSync(source, { recursive: true, force: true })
    fs.rmSync(staging, { recursive: true, force: true })
  }
}
try { console.log(JSON.stringify(initialize())) }
catch { console.error('Global configuration initialization failed; existing data was preserved.'); process.exitCode = 1 }
