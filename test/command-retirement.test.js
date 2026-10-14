const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const { buildCommandCatalog } = require('../handlers/command-registry')
const root = path.resolve(__dirname, '..')
const run = async () => {}
const exportsByFile = {
  'ping.js': { name: 'ping', category: 'Info', description: 'Ping', aliases: ['p'], run },
  'flagged.js': { name: 'flagged', category: 'Info', description: 'Unavailable', nsfw: true, run },
  'category.js': { name: 'category', category: '🔞 NSFW', description: 'Unavailable', run },
  'retired.js': { name: 'setup-autonsfw', category: 'Setup', description: 'Unavailable', run },
  'branded.js': { name: 'brazzers', category: 'Fun', description: 'Image', run },
  'profane.js': { name: 'shit', category: 'Fun', description: 'Image', run },
}
function loader(file, kind) {
  const filename = path.join(root, 'handlers', file)
  const requireFromFile = createRequire(filename), requests = []
  const customRequire = request => {
    if (request === 'fs') return {
      readdirSync(directory) { return directory === './' + kind + '/' ? ['Info', 'NSFW'] : Object.keys(exportsByFile) },
      lstatSync: () => ({ isDirectory: () => true }),
    }
    if (request === 'discord-giveaways') return { GiveawaysManager: class { on() {} } }
    if (request.startsWith('../' + kind + '/')) {
      requests.push(request)
      return exportsByFile[path.basename(request)]
    }
    return requireFromFile(request)
  }
  const sandbox = { module: { exports: {} }, require: customRequire, process: { cwd: () => root }, console: { log() {} } }
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename })
  return { initialize: sandbox.module.exports, requests }
}
test('prefix loader rejects restricted folders, flags, metadata and retired setup names', async () => {
  const { initialize, requests } = loader('command.js', 'commands')
  const client = { commands: new Map() }
  await initialize(client)
  assert.deepEqual([...client.commands.keys()], ['ping'])
  assert.equal(client.aliases.get('p'), 'ping')
  assert.equal(requests.some(request => request.includes('/NSFW/')), false)
})
test('slash loader cannot publish restricted subcommands even under an ordinary folder', () => {
  const { initialize, requests } = loader('slashCommands.js', 'slashCommands')
  const client = { slashCommands: new Map() }
  initialize(client)
  assert.deepEqual([...client.slashCommands.keys()], ['infoping'])
  assert.deepEqual([...client.allCommands].map(schema => schema.name), ['info'])
  assert.deepEqual([...client.allCommands[0].options].map(option => option.name), ['ping'])
  assert.equal(requests.some(request => request.includes('/NSFW/')), false)
})
test('catalog excludes restricted records rather than relying on a guild or channel switch', () => {
  const commands = new Map(Object.values(exportsByFile).map(command => [command.name, command]))
  const client = { commands, aliases: new Map([['p', 'ping']]), slashCommands: new Map([['nsfwcategory', exportsByFile['category.js']]]),
    allCommands: [{ name: 'nsfw', options: [{ type: 1, name: 'category' }] }] }
  const catalog = buildCommandCatalog(client)
  assert.deepEqual(catalog.map(entry => entry.id), ['prefix:ping'])
  assert.deepEqual(catalog[0].aliases, ['p'])
})
test('shipping trees and actual slash schemas contain no restricted commands or automatic sender', () => {
  for (const kind of ['commands', 'slashCommands']) {
    for (const category of fs.readdirSync(path.join(root, kind))) {
      assert.ok(!/nsfw/i.test(category), 'Retired category remains in ' + kind)
      const directory = path.join(root, kind, category)
      if (!fs.statSync(directory).isDirectory()) continue
      for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.js'))) {
        const command = require(path.join(directory, file))
        assert.ok(command.nsfw !== true && !/nsfw/i.test(command.category || '') && !/nsfw/i.test(command.name || ''), kind + '/' + category + '/' + file)
      }
    }
  }
  assert.equal(fs.existsSync(path.join(root, 'handlers/autonsfw.js')), false)
  const client = { slashCommands: new Map() }; require('../handlers/slashCommands')(client)
  assert.ok(client.allCommands.some(command => command.name === 'music'))
  assert.ok(client.allCommands.some(command => command.name === 'anime'))
  assert.ok(client.allCommands.every(command => command.nsfw !== true && !/nsfw/i.test(command.name)))
})
test('Fun retains ordinary memes without adult branding or profanity in published names and descriptions', () => {
  const client = { slashCommands: new Map() }; require('../handlers/slashCommands')(client)
  const fun = client.allCommands.find(command => command.name === 'fun')
  assert.ok(fun && fun.nsfw !== true)
  assert.ok(fun.options.some(option => option.name === 'facepalm'))
  assert.ok(fun.options.some(option => option.name === 'stonks'))
  assert.ok(fun.options.every(option => !/\b(shit|fuck|brazzers|porn|nsfw)\b/i.test(option.name + ' ' + option.description)))
  const { names, createMemeService } = require('../handlers/meme-service')
  assert.ok(names.includes('stonks'))
  for (const name of ['brazzers', 'shit']) {
    assert.equal(names.includes(name), false)
    assert.equal(createMemeService()[name], undefined)
    assert.equal(fs.existsSync(path.join(root, 'commands/Fun', name + '.js')), false)
    assert.equal(fs.existsSync(path.join(root, 'image-service/upstream/endpoints', name + '.py')), false)
    assert.equal(fs.existsSync(path.join(root, 'image-service/assets', name)), false)
  }
})
