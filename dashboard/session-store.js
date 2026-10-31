// Fence writes through the documented session-store interface. Ordering is for
// this process; distributed session ownership remains part of P5.
const stamp = value => JSON.stringify([value?.authVersion ?? null, value?.user?.id,
  value?.user?.access_token, value?.user?.refresh_token])
const stateStamp = value => JSON.stringify([value?.oauthState ?? null, value?.oauthPending ?? null, value?.csrfToken ?? null, value?.oauthSuccessor ?? null])
const fail = code => { throw Object.assign(new Error(code), { code }) }

function fenceSessionStore(store) {
  const base = Object.fromEntries(['get', 'set', 'destroy', 'touch'].filter(name => typeof store[name] === 'function').map(name => [name, store[name].bind(store)]))
  const pending = new Map(), grants = new Map(), rotations = new Map()
  let retiring = null
  const call = (method, ...args) => new Promise((resolve, reject) => base[method](...args, (error, value) => error ? reject(error) : resolve(value)))
  function ordered(sid, operation, callback = () => {}) {
    const result = (pending.get(sid) || Promise.resolve()).then(operation)
    const tail = result.then(() => {}, () => {})
    pending.set(sid, tail)
    tail.then(() => { if (pending.get(sid) === tail) pending.delete(sid) })
    result.then(value => callback(null, value), error => callback(error))
    return result
  }
  function grant(sid, document, kind, expected) {
    const entry = { document, kind, expected: stamp(expected), state: stateStamp(expected), expiresAt: Date.now() + 15000 }
    let entries = grants.get(sid)
    if (!entries) { entries = new Set(); grants.set(sid, entries) }
    entries.add(entry)
    return () => { entries.delete(entry); if (!entries.size && grants.get(sid) === entries) grants.delete(sid) }
  }
  store.allowIssue = (sid, document) => grant(sid, document, 'issue')
  store.allowUserUpdate = (sid, document, expected) => grant(sid, document, 'user', expected)
  store.allowStateUpdate = (sid, document, expected) => {
    const initial = [...(grants.get(sid) || [])].find(entry => entry.kind === 'issue' && entry.document === document && entry.expiresAt > Date.now())
    if (initial) return () => {}
    return grant(sid, document, 'state', expected)
  }
  store.set = (sid, document, callback) => {
    let snapshot
    try { snapshot = JSON.parse(JSON.stringify(document)) }
    catch (error) { return (callback || (() => {}))(error) }
    ordered(sid, async () => {
      const entries = grants.get(sid)
      const capability = [...(entries || [])].find(entry => entry.document === document && entry.expiresAt > Date.now())
      const allowed = capability?.document === document && capability.expiresAt > Date.now()
      if (allowed) { entries.delete(capability); if (!entries.size) grants.delete(sid) }
      const current = await call('get', sid)
      if (allowed && capability.kind === 'issue') {
        if (current) fail('session_changed')
      } else {
        if (!current) fail('session_revoked')
        if (allowed && capability.kind === 'user') {
          if (stamp(current) !== capability.expected || current.user?.id !== snapshot.user?.id || current.authVersion !== snapshot.authVersion || stateStamp(current) !== stateStamp(snapshot)) fail('session_changed')
        } else if (allowed && capability.kind === 'state') {
          if (stamp(current) !== capability.expected || stateStamp(current) !== capability.state || stamp(current) !== stamp(snapshot)) fail('session_changed')
        } else if (stamp(current) !== stamp(snapshot) || stateStamp(current) !== stateStamp(snapshot)) fail('session_changed')
      }
      return call('set', sid, snapshot)
    }, callback)
  }
  store.get = (sid, callback) => ordered(sid, () => call('get', sid), callback)
  function destroyOrdered(sid, visited = new Set()) {
    if (visited.has(sid)) return Promise.resolve()
    if (visited.size >= 256) return Promise.reject(Object.assign(new Error('session_unavailable'), { code: 'session_unavailable' }))
    visited.add(sid)
    grants.delete(sid)
    const affected = [...(rotations.get(sid) || [])]
    for (const entry of affected) entry.cancelled = true
    return ordered(sid, async () => {
      const current = await call('get', sid)
      await call('destroy', sid)
      const children = new Set([current?.oauthSuccessor, ...affected.map(entry => entry.nextSid)].filter(Boolean))
      for (const child of children) await destroyOrdered(child, visited)
    })
  }
  store.destroy = (sid, done = () => {}) => {
    // Session.regenerate calls destroy synchronously. Only that call may bypass
    // the SID queue already held by this rotation; other requests cannot enter
    // this synchronous scope and still cancel the rotation normally.
    if (retiring === sid) return base.destroy(sid, done)
    destroyOrdered(sid).then(() => done(), error => done(error))
  }
  store.beginRotation = sid => {
    const entry = { cancelled: false, nextSid: null }
    let entries = rotations.get(sid)
    if (!entries) { entries = new Set(); rotations.set(sid, entries) }
    entries.add(entry)
    const check = () => { if (entry.cancelled) fail('session_revoked') }
    return {
      check,
      regenerate(req, pendingId) {
        return ordered(sid, async () => {
          check()
          const current = await call('get', sid)
          check()
          if (!current || current.oauthPending !== pendingId) fail('session_revoked')
          if (current.oauthSuccessor) await destroyOrdered(current.oauthSuccessor, new Set([sid]))
          check()
          await new Promise((resolve, reject) => {
            retiring = sid
            try {
              req.session.regenerate(error => {
                if (req.sessionID !== sid) entry.nextSid = req.sessionID
                error ? reject(error) : resolve()
              })
            } finally { retiring = null }
          })
          if (typeof entry.nextSid !== 'string' || !entry.nextSid || entry.nextSid === sid) fail('session_changed')
          // Keep only routing metadata for old signed cookies. A logout already
          // in flight can then revoke the child even after the callback ends.
          // No profile, OAuth token or reusable login state remains in this row.
          await call('set', sid, { cookie: JSON.parse(JSON.stringify(req.session.cookie)), oauthSuccessor: entry.nextSid })
          check()
        })
      },
      close() { entries.delete(entry); if (!entries.size && rotations.get(sid) === entries) rotations.delete(sid) }
    }
  }
  if (base.touch) store.touch = (sid, document, callback) => ordered(sid, () => call('touch', sid, document), callback)
  return store
}
module.exports = { fenceSessionStore, stamp }
