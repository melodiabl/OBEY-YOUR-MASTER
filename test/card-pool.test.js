const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { fork } = require('node:child_process')
const { createCanvas } = require('@napi-rs/canvas')
const { createCardPool } = require('../handlers/card-pool')
const fixtureWorker = path.join(__dirname, 'helpers/card-worker-fixture.js')
const payload = (name = 'Obey') => ({ data: { username: name, discriminator: '0', guildName: 'Guild', memberCount: 10 }, showAvatar: false })
const pools = new Set()
test.afterEach(async () => { await Promise.all([...pools].map(pool => pool.close())); pools.clear() })
function pool(options = {}) {
  const instance = createCardPool({ workerPath: fixtureWorker, concurrency: 1, maxQueue: 2, timeoutMs: 2000, queueTimeoutMs: 2000, ...options })
  pools.add(instance); return instance
}

test('real child returns PNG and inherits neither bot credentials nor Node preload flags', async () => {
  const old = { BOT_TOKEN: process.env.BOT_TOKEN, DATABASE_URL: process.env.DATABASE_URL, NODE_OPTIONS: process.env.NODE_OPTIONS }
  Object.assign(process.env, { BOT_TOKEN: 'fixture-secret', DATABASE_URL: 'fixture-private-db', NODE_OPTIONS: '--trace-warnings' })
  const instance = pool()
  try {
    const buffer = await instance.render('welcome', payload('env'))
    assert.ok(buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    assert.deepEqual(instance.state(), { active: 0, queued: 0, closed: false })
  } finally {
    for (const [key, value] of Object.entries(old)) if (value === undefined) delete process.env[key]; else process.env[key] = value
  }
})

test('blocked native-style work is killed by deadline; next job succeeds and parent stays responsive', async () => {
  const instance = pool({ timeoutMs: 600 })
  let ticks = 0
  const timer = setInterval(() => ticks++, 10)
  try {
    await assert.rejects(instance.render('leave', payload('hang')), error => error.code === 'card_worker_timeout')
    assert.ok(ticks > 3)
    assert.ok(Buffer.isBuffer(await instance.render('welcome', payload())))
    assert.equal(instance.state().active, 0)
  } finally { clearInterval(timer) }
})

test('crash, malformed output and wrong response id never strand a slot or expose child errors', async () => {
  const instance = pool()
  for (const mode of ['crash', 'invalid', 'wrong-id']) {
    await assert.rejects(instance.render('welcome', payload(mode)), error => error.code === 'card_worker_failed')
    assert.deepEqual(instance.state(), { active: 0, queued: 0, closed: false })
  }
  assert.ok(Buffer.isBuffer(await instance.render('leave', payload())))
})

test('queue is bounded, preserves arrival order and expires without starting a waiting child', async () => {
  const starts = [], instance = pool({ maxQueue: 1, queueTimeoutMs: 80, forkProcess: (...args) => { starts.push(args); return fork(...args) } })
  const first = instance.render('welcome', payload('slow'))
  const waiting = assert.rejects(instance.render('welcome', payload()), error => error.code === 'card_queue_timeout')
  await assert.rejects(instance.render('welcome', payload()), error => error.code === 'card_queue_full')
  await waiting; await first
  assert.equal(starts.length, 1)
  const ordered = pool(), output = []
  await Promise.all(['slow', 'two', 'three'].map(name => ordered.render('welcome', payload(name)).then(() => output.push(name))))
  assert.deepEqual(output, ['slow', 'two', 'three'])
})

test('invalid DTO, executable fields, URLs and oversized media are rejected before a child is created', async () => {
  let starts = 0
  const instance = pool({ forkProcess: (...args) => { starts++; return fork(...args) } })
  for (const data of [
    { ...payload(), token: 'secret' }, { ...payload(), data: { ...payload().data, email: 'private' } },
    { ...payload(), data: { ...payload().data, username: () => 'bad' } },
    { ...payload(), avatarBuffer: 'https://example.test/avatar.png' },
    { ...payload(), backgroundBuffer: '/etc/passwd' }, { ...payload(), avatarBuffer: Buffer.alloc(4 * 1024 * 1024 + 1) },
  ]) await assert.rejects(instance.render('welcome', data), error => error.code === 'invalid_card_job')
  await assert.rejects(instance.render('other', payload()), error => error.code === 'invalid_card_job')
  assert.equal(starts, 0)
})

test('memory budget kills native allocations and subsequent work can proceed', async () => {
  const instance = pool({ rssLimitBytes: 80 * 1024 * 1024, pollMs: 10 })
  await assert.rejects(instance.render('welcome', payload('memory')), error => error.code === 'card_worker_memory')
  assert.ok(Buffer.isBuffer(await instance.render('leave', payload())))
})

test('closing rejects running and queued jobs, waits for child exit, and prevents new work', async () => {
  const instance = pool()
  const running = assert.rejects(instance.render('welcome', payload('hang')), error => error.code === 'card_pool_closed')
  const waiting = assert.rejects(instance.render('leave', payload()), error => error.code === 'card_pool_closed')
  await instance.close(); await Promise.all([running, waiting])
  assert.deepEqual(instance.state(), { active: 0, queued: 0, closed: true })
  await assert.rejects(instance.render('welcome', payload()), error => error.code === 'card_pool_closed')
  await instance.close()
})

test('production worker decodes buffers, renders its PNG, and exits after one job', async () => {
  const instance = pool({ workerPath: path.join(__dirname, '../handlers/card-worker.js'), timeoutMs: 8000 })
  const buffer = await instance.render('welcome', { ...payload(), frameColor: '#3A98F0',
    avatarBuffer: createCanvas(40, 40).toBuffer('image/png'), showAvatar: true, showServerName: true })
  assert.ok(buffer.length > 10000)
  assert.equal(instance.state().active, 0)
})

test('kernel CPU/data/core limits are active inside the real child', async () => {
  assert.ok(Buffer.isBuffer(await pool().render('welcome', payload('limits'))))
})

test('media preparation is admitted through the queue and has a deadline before starting a child', async () => {
  let loads = 0
  const instance = pool({ maxQueue: 1, prepareTimeoutMs: 100 })
  const blocked = assert.rejects(instance.render('welcome', () => new Promise(() => {})), error => error.code === 'card_prepare_timeout')
  const waiting = instance.render('leave', async () => { loads++; return payload() })
  await assert.rejects(instance.render('welcome', async () => { loads++; return payload() }), error => error.code === 'card_queue_full')
  await blocked; await waiting
  assert.equal(loads, 1)
})

test('closing while preparing rejects the job and late media cannot start a process', async () => {
  let release, starts = 0
  const instance = pool({ forkProcess: (...args) => { starts++; return fork(...args) } })
  const result = assert.rejects(instance.render('welcome', () => new Promise(resolve => { release = resolve })), error => error.code === 'card_pool_closed')
  await new Promise(resolve => setImmediate(resolve))
  await instance.close(); release(payload())
  await result; await new Promise(resolve => setImmediate(resolve))
  assert.equal(starts, 0)
})
