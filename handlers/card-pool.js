const { fork } = require('node:child_process')
const { readFile } = require('node:fs/promises')
const path = require('node:path')
const { randomBytes } = require('node:crypto')
const { cardJob, cardResult } = require('./card-job')
const failure = code => Object.assign(new Error(code), { code })
const root = path.resolve(__dirname, '..')

function createCardPool({ concurrency = 1, maxQueue = 4, timeoutMs = 8000, queueTimeoutMs = 2000,
  prepareTimeoutMs = 5500, rssLimitBytes = 256 * 1024 * 1024, pollMs = 50,
  workerPath = path.join(__dirname, 'card-worker.js'), forkProcess = fork } = {}) {
  const values = [[concurrency, 1, 2], [maxQueue, 0, 16], [timeoutMs, 100, 30000], [queueTimeoutMs, 10, 5000],
    [prepareTimeoutMs, 100, 10000], [rssLimitBytes, 32 * 1024 * 1024, 256 * 1024 * 1024], [pollMs, 10, 100]]
  if (values.some(([value, min, max]) => !Number.isInteger(value) || value < min || value > max)) throw failure('invalid_card_pool')
  const active = new Set(), queue = []
  let closed = false, closePromise
  const state = () => ({ active: active.size, queued: queue.length, closed })

  function pump() {
    while (!closed && active.size < concurrency && queue.length) start(queue.shift())
  }
  function start(job) {
    clearTimeout(job.queueTimer); active.add(job)
    let finished = false, outcome, timer, monitor, reaper, reading = false
    let exited
    job.exit = new Promise(resolve => { exited = resolve })
    function settle() {
      if (job.settled) return
      job.settled = true
      if (outcome?.error) job.reject(outcome.error)
      else job.resolve(outcome?.buffer)
    }
    function finish() {
      if (finished) return
      finished = true
      clearTimeout(timer); clearInterval(monitor); clearTimeout(reaper)
      outcome ||= { error: failure('card_worker_failed') }
      active.delete(job); job.source = null; exited(); settle(); pump()
    }
    function stop(error) {
      if (finished || outcome) return
      outcome = { error }
      clearTimeout(timer); clearInterval(monitor)
      if (!job.child) { finish(); return }
      job.child.kill('SIGKILL')
      // Never free the concurrency slot before the OS confirms exit.
      reaper = setTimeout(() => { settle(); job.child.unref(); job.child.channel?.unref() }, 1000)
    }
    job.stop = stop
    timer = setTimeout(() => stop(failure('card_prepare_timeout')), prepareTimeoutMs)
    Promise.resolve().then(() => typeof job.source === 'function' ? job.source() : job.source).then(input => {
      if (finished || outcome) return
      const payload = cardJob(job.kind, input)
      job.source = null; clearTimeout(timer)
      if (closed) { stop(failure('card_pool_closed')); return }
      if (process.platform !== 'linux') { stop(failure('card_worker_unavailable')); return }
      const seconds = Math.ceil(timeoutMs / 1000)
      job.child = forkProcess(workerPath, [], {
        cwd: root, execPath: '/usr/bin/prlimit', serialization: 'advanced', stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
        execArgv: [`--data=402653184:402653184`, `--cpu=${seconds}:${seconds}`, '--core=0:0', '--', process.execPath, '--max-old-space-size=96'],
        env: { LANG: 'C.UTF-8', UV_THREADPOOL_SIZE: '2', RAYON_NUM_THREADS: '2' },
      })
      const child = job.child
      timer = setTimeout(() => stop(failure('card_worker_timeout')), timeoutMs)
      child.once('error', () => stop(failure('card_worker_failed')))
      child.once('close', finish)
      child.on('message', response => {
        if (finished || outcome) return
        try {
          if (response?.id !== job.id || response.error) throw Error('invalid_result')
          outcome = { buffer: cardResult(response.buffer) }
          clearTimeout(timer); clearInterval(monitor)
          child.kill('SIGKILL')
          reaper = setTimeout(() => {
            // A result is usable only after this one-job child has exited.
            outcome = { error: failure('card_worker_failed') }; settle(); child.unref(); child.channel?.unref()
          }, 1000)
        } catch { stop(failure('card_worker_failed')) }
      })
      monitor = setInterval(async () => {
        if (reading || finished || outcome || !child.pid) return
        reading = true
        try {
          const status = await readFile(`/proc/${child.pid}/status`, 'utf8')
          const rss = Number(status.match(/^VmRSS:\s+(\d+) kB$/m)?.[1]) * 1024
          if (Number.isFinite(rss) && rss > rssLimitBytes) stop(failure('card_worker_memory'))
        } catch (error) {
          if (error.code !== 'ENOENT' && error.code !== 'ESRCH') stop(failure('card_worker_unavailable'))
        } finally { reading = false }
      }, pollMs)
      child.send({ id: job.id, kind: job.kind, payload }, error => { if (error) stop(failure('card_worker_failed')) })
    }).catch(error => stop(failure(error?.code === 'invalid_card_job' ? 'invalid_card_job' : 'card_worker_failed')))
  }

  function render(kind, source) {
    if (closed) return Promise.reject(failure('card_pool_closed'))
    if (!['welcome', 'leave', 'background'].includes(kind)) return Promise.reject(failure('invalid_card_job'))
    if (active.size >= concurrency && queue.length >= maxQueue) return Promise.reject(failure('card_queue_full'))
    try { if (typeof source !== 'function') source = cardJob(kind, source) } catch { return Promise.reject(failure('invalid_card_job')) }
    return new Promise((resolve, reject) => {
      const job = { id: randomBytes(12).toString('hex'), kind, source, resolve, reject, settled: false }
      if (active.size < concurrency) start(job)
      else {
        job.queueTimer = setTimeout(() => {
          const index = queue.indexOf(job)
          if (index < 0) return
          queue.splice(index, 1); job.source = null; reject(failure('card_queue_timeout'))
        }, queueTimeoutMs)
        queue.push(job)
      }
    })
  }
  function close() {
    if (closePromise) return closePromise
    closed = true
    for (const job of queue.splice(0)) { clearTimeout(job.queueTimer); job.source = null; job.reject(failure('card_pool_closed')) }
    const waiting = [...active].map(job => { job.stop(failure('card_pool_closed')); return job.exit })
    closePromise = new Promise(resolve => {
      const timer = setTimeout(resolve, 1100)
      Promise.all(waiting).then(() => { clearTimeout(timer); resolve() })
    })
    return closePromise
  }
  return { render, close, state }
}

let shared
const cardPool = () => shared ||= createCardPool()
module.exports = { createCardPool, cardPool }
