'use strict'

// Repository gate only: reads local contracts and sources; never loads the bot.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  }
  return value
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
}

function verifyClassification(options = {}) {
  const root = options.root || path.resolve(__dirname, '..')
  const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
  const data = options.classification || read('docs/platform/p0-classification.json')
  const inventory = options.inventory || read('docs/platform/operation-ownership.json')
  const review = options.review || read('docs/platform/shared-intents.json')
  const backlog = options.backlog || read('docs/guia-arquitectura/investigacion-20261022/backlog.json')
  assert.equal(data.schemaVersion, 1)
  assert.equal(data.gateAcceptance, 'not-assessed-by-classification')
  const core = Object.fromEntries(['commands', 'routes', 'aliases', 'aliasResolutions'].map(key => [key, inventory[key]]))
  assert.equal(data.inputs.inventoryCoreSha256, digest(core), 'Inventory changed: reconcile classification')
  assert.equal(data.inputs.sharedIntentsSha256, digest(review), 'Review changed: reconcile classification')
  const gates = backlog.tasks.filter(task => task.priority === 'P0').map(task =>
    Object.fromEntries(['id', 'priority', 'owner', 'title', 'acceptance'].map(key => [key, task[key]])))
  assert.deepEqual(data.originalP0Gates, gates, 'Preserve original P0 criteria, including G25')
  assert.deepEqual(gates.map(gate => gate.id), ['G01', 'G02', 'G25'])

  const caps = Object.entries(data.capabilities)
  assert(caps.length > 0)
  const taskIds = new Set(backlog.tasks.map(task => task.id))
  // Phase policy comes from the master plan, independently of the data being checked.
  const phases = {
    P0: ['platform', 'owner'],
    P1: ['music', 'library'],
    P2: ['configuration', 'welcome', 'cards', 'tickets', 'moderation', 'logs', 'roles', 'security', 'messages', 'profiles', 'utilities', 'voice', 'levels'],
    P5: ['recovery'],
    P6: ['economy', 'giveaways', 'invites', 'community', 'feeds', 'fun', 'developer-tools', 'reminders', 'architect']
  }
  const expectedPhases = new Map(Object.entries(phases).flatMap(([phase, ids]) => ids.map(id => [id, phase])))
  assert.deepEqual(caps.map(([id]) => id).sort(), [...expectedPhases.keys()].sort())
  for (const [id, cap] of caps) {
    assert(/^[a-z][a-z-]*$/.test(id), `Invalid capability: ${id}`)
    assert.equal(cap.phase, expectedPhases.get(id), `Preserve master phase: ${id}`)
    const task = { platform: 'P0-C3', owner: 'P0-C2', 'developer-tools': 'P6-DEVTOOLS', configuration: 'P2-CONFIG' }[id] || `${cap.phase}-${id.toUpperCase()}`
    assert.equal(cap.task, task, `Missing phase task: ${id}`)
    assert.equal(cap.status, 'pending-capability-acceptance')
    for (const field of ['label', 'authorityReview', 'acceptance']) assert(cap[field]?.trim(), `Missing ${field}: ${id}`)
    assert.deepEqual(cap.transversal, ['P3'])
    assert(cap.contracts.length > 0 && cap.contracts.every(task => taskIds.has(task)), `Missing original contract: ${id}`)
  }

  // Validate live files without interpreting any command or config module.
  for (const [file, expected] of Object.entries(inventory.sourceHashes)) {
    assert(file && !path.isAbsolute(file) && !file.includes('\\') && file.split('/').every(part => part && part !== '.' && part !== '..'), `Invalid source path: ${file}`)
    assert.match(expected, /^[a-f0-9]{64}$/)
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')
    assert.equal(actual, expected, `Stale source hash: ${file}`)
  }

  const links = new Map(), intentIds = new Set(), reviewedCommands = new Set(), reviewedRoutes = new Set()
  const commandIds = new Set(inventory.commands.map(entry => entry.id))
  const routeIds = new Set(inventory.routes.map(entry => entry.id))
  assert.equal(commandIds.size, inventory.commands.length)
  assert.equal(routeIds.size, inventory.routes.length)
  for (const intent of review.reviewedIntents) {
    assert(!intentIds.has(intent.id), `Duplicate reviewed intent: ${intent.id}`)
    intentIds.add(intent.id)
    for (const [ids, known, seen] of [[intent.commands, commandIds, reviewedCommands], [intent.routes, routeIds, reviewedRoutes]]) {
      for (const id of ids) {
        assert(known.has(id), `Unknown reviewed entry: ${id}`)
        seen.add(id)
        if (!links.has(id)) links.set(id, new Set())
        links.get(id).add(intent.id)
      }
    }
  }
  const functionalReview = {
    reviewedGroups: intentIds.size,
    commandEntriesReviewed: reviewedCommands.size,
    httpRoutesReviewed: reviewedRoutes.size,
    totalCommandEntries: commandIds.size,
    totalHttpRoutes: routeIds.size,
    remainingCommandEntries: commandIds.size - reviewedCommands.size,
    remainingHttpRoutes: routeIds.size - reviewedRoutes.size
  }
  assert.deepEqual(review.coverage, functionalReview, 'Functional review must match traced IDs')
  assert.deepEqual(data.coverage.functionalReview, functionalReview, 'Classification cannot promote functional review')

  const baseRoutes = new Set([
    'GET /health', 'GET /', 'GET /login', 'GET /auth/callback', 'POST /logout',
    'GET /panel', 'POST /api/refresh-guilds', 'GET /api/sse', 'GET /api/stats',
    'GET /dashboard', 'GET /api/panel/context', 'GET /app', 'GET /app/'
  ])
  const counts = Object.fromEntries(caps.map(([id]) => [id, { commands: 0, routes: 0 }]))
  for (const surface of ['commands', 'routes']) {
    const expected = new Map(inventory[surface].map(entry => [entry.id, entry]))
    const seen = new Set()
    for (const entry of data[surface]) {
      assert.deepEqual(Object.keys(entry).sort(), ['capability', 'flags', 'id', 'reviewedIntents'])
      assert(expected.has(entry.id) && !seen.has(entry.id), `Unknown/duplicate classified entry: ${entry.id}`)
      seen.add(entry.id)
      assert(Object.hasOwn(data.capabilities, entry.capability), `Unknown capability: ${entry.id}`)
      const source = expected.get(entry.id)
      let baseCapability = null
      if (surface === 'commands' && (source.category === 'Owner' || source.id === 'prefix:servers')) baseCapability = 'owner'
      if (surface === 'routes' && baseRoutes.has(source.id)) baseCapability = 'platform'
      if (baseCapability) assert.equal(entry.capability, baseCapability, `Preserve base membership: ${entry.id}`)
      else assert.notEqual(data.capabilities[entry.capability].phase, 'P0', `Business entry cannot move to P0: ${entry.id}`)
      assert(Object.hasOwn(inventory.sourceHashes, source.owner), `Missing source hash: ${entry.id}`)
      assert.equal(inventory.owners[source.owner]?.kind, surface === 'commands' ? 'current-command-adapter' : 'current-http-adapter')
      assert.deepEqual(entry.reviewedIntents, [...(links.get(entry.id) || [])].sort(), `Invalid reviewed links: ${entry.id}`)
      assert(Array.isArray(entry.flags) && entry.flags.every(flag => typeof flag === 'string' && flag.length > 0))
      for (const flag of entry.flags.filter(flag => flag.startsWith('P0-'))) {
        assert(flag.startsWith('P0-C2:'), `Unknown base review task: ${entry.id}`)
      }
      counts[entry.capability][surface]++
    }
    assert.equal(seen.size, expected.size, `Missing classified ${surface}`)
  }
  assert.equal(data.coverage.classifiedCommands, commandIds.size)
  assert.equal(data.coverage.classifiedRoutes, routeIds.size)
  assert.deepEqual(data.coverage.byCapability, counts)

  // Findings remain traceable until a reviewed resolution explicitly updates this policy.
  const requiredFindings = {
    servers: 'exact-owner-match',
    giveaway: 'input-code-generation',
    loadbackup: 'destructive-boundary-review'
  }
  for (const name of 'ahshit hellomf surprisemf ha-gay kuss-digga verpissdich ph-intro wryd-stepbro hitler cancer disability violence a-kill kill'.split(' ')) {
    requiredFindings[name] = 'content-triage-required'
  }
  const classified = new Map([...data.commands, ...data.routes].map(entry => [entry.id, entry]))
  for (const [name, finding] of Object.entries(requiredFindings)) {
    assert(classified.get('prefix:' + name)?.flags.includes('P0-C2:' + finding), `Missing base finding: ${name}`)
  }
  for (const entry of [...inventory.commands.filter(entry => entry.category === 'Playlist' || entry.category === 'Favoritos' || ['playlist', 'like', 'likedsongs', 'savedqueue'].includes(entry.name)),
    ...inventory.routes.filter(entry => /\/(?:library|like(?:d)?|playlist)(?:\/|$)/.test(entry.path))]) {
    assert.equal(classified.get(entry.id).capability, 'library', `Keep library transports together: ${entry.id}`)
  }

  const csv = fs.readFileSync(path.join(root, 'docs/guia-arquitectura/investigacion-20261022/comandos-base.csv'), 'utf8')
  // This frozen source uses unquoted first columns; only paths are needed here.
  const originalFiles = new Set(csv.trim().split(/\r?\n/).slice(1).map(line => {
    const [directory, file] = line.split(',')
    assert(['commands', 'slashCommands'].includes(directory) && file.startsWith(directory + '/'), 'Unexpected original CSV format')
    return file
  }))
  const currentFiles = new Set(inventory.commands.map(entry => entry.owner))
  assert.deepEqual(data.baselineDifference, {
    originalCandidateFiles: originalFiles.size,
    currentAdapterFiles: currentFiles.size,
    added: [...currentFiles].filter(file => !originalFiles.has(file)).sort(),
    retired: [...originalFiles].filter(file => !currentFiles.has(file)).sort()
  })
  return { classifiedCommands: commandIds.size, classifiedRoutes: routeIds.size, capabilities: caps.length, functionalReview, gateAcceptance: data.gateAcceptance }
}

if (require.main === module) {
  try {
    console.log(JSON.stringify(verifyClassification()))
  } catch (error) {
    console.error(`P0 classification gate failed: ${error.message}`)
    process.exitCode = 1
  }
}

module.exports = { verifyClassification }
