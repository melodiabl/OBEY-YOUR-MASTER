const { randomBytes, randomUUID } = require('node:crypto')
const { stamp } = require('./session-store')
const fail = code => { throw Object.assign(new Error(code), { code }) }
const validUser = user => typeof user?.id === 'string' && /^\d{17,20}$/.test(user.id) && typeof user.access_token === 'string' && user.access_token.length > 0 && Number.isFinite(user.expires_at)
const sameLogin = (session, expected) => session?.user?.id === expected.user.id && session?.authVersion === expected.authVersion
const callback = operation => new Promise((resolve, reject) => operation(error => error ? reject(error) : resolve()))
async function reloadStored(req) {
  try { await callback(done => req.session.reload(done)) }
  catch (error) {
    const current = await new Promise((resolve, reject) => req.sessionStore.get(req.sessionID, (failure, data) => failure ? reject(failure) : resolve(data)))
    if (!current) fail('not_authenticated')
    throw error
  }
  return req.session
}
async function reloadSession(req) {
  await reloadStored(req)
  if (!validUser(req.session?.user)) fail('not_authenticated')
  return req.session
}
async function invalidateSession(req) {
  if (req.session?.destroy) await callback(done => req.session.destroy(done))
  else await callback(done => req.sessionStore.destroy(req.sessionID, done))
}
async function saveSession(req, expected, kind = 'user') {
  let release
  try {
    if (expected) {
      const method = kind === 'state' ? 'allowStateUpdate' : 'allowUserUpdate'
      if (typeof req.sessionStore?.[method] !== 'function') fail('session_unavailable')
      release = req.sessionStore[method](req.sessionID, req.session, expected)
    }
    await callback(done => req.session.save(done))
  } catch (error) {
    if (error.code === 'session_revoked') fail('not_authenticated')
    throw error
  } finally { release?.() }
}
const invalidCredentials = error => error?.response?.status === 401 || error?.response?.data?.error === 'invalid_grant'
const issuedRequests = new WeakMap()
function createSessionId(req) {
  const sid = randomBytes(32).toString('base64url')
  issuedRequests.set(req, sid)
  return sid
}
function trackSessionIssuance(req, res, next) {
  const sid = issuedRequests.get(req)
  issuedRequests.delete(req)
  if (sid === req.sessionID && req.session) {
    const release = req.sessionStore.allowIssue(sid, req.session)
    res.once('finish', release)
    res.once('close', release)
  }
  next()
}

function sessionAuth(refreshUser, { refreshWindowMs = 60000 } = {}) {
  const pendingByStore = new WeakMap()
  return async (req, res, next) => {
    res.set('Cache-Control', 'private, no-store').vary('Cookie')
    const reject = (reason, error) => req.path?.startsWith('/api/')
      ? res.status(401).json({ error }) : res.redirect(`/login?reason=${reason}${req.path === '/app' || req.path?.startsWith('/app/') ? '&returnTo=%2Fapp' : ''}`)
    if (!validUser(req.session?.user)) return reject('not_logged_in', 'not_authenticated')
    const expected = { authVersion: req.session.authVersion, user: { ...req.session.user } }
    try {
      await reloadSession(req)
      if (!sameLogin(req.session, expected)) fail('not_authenticated')
      if (req.session.user.expires_at <= Date.now() + refreshWindowMs) {
        let pending = pendingByStore.get(req.sessionStore)
        if (!pending) { pending = new Map(); pendingByStore.set(req.sessionStore, pending) }
        const sid = req.sessionID
        let operation = pending.get(sid)
        if (!operation) {
          operation = (async () => {
            await reloadSession(req)
            if (!sameLogin(req.session, expected)) fail('not_authenticated')
            if (req.session.user.expires_at > Date.now() + refreshWindowMs) return
            const before = { authVersion: req.session.authVersion, user: { ...req.session.user } }
            const refreshed = await refreshUser(before.user)
            if (!validUser(refreshed) || refreshed.id !== before.user.id || refreshed.expires_at <= Date.now()) fail('not_authenticated')
            await reloadSession(req)
            if (!sameLogin(req.session, before)) fail('not_authenticated')
            if (stamp(req.session) !== stamp(before)) {
              if (req.session.user.expires_at <= Date.now()) fail('not_authenticated')
              return
            }
            req.session.user = refreshed
            await saveSession(req, before)
          })()
          pending.set(sid, operation)
          operation.then(() => { if (pending.get(sid) === operation) pending.delete(sid) }, () => { if (pending.get(sid) === operation) pending.delete(sid) })
        }
        await operation
        await reloadSession(req)
      }
      if (!sameLogin(req.session, expected) || req.session.user.expires_at <= Date.now()) fail('not_authenticated')
      if (!/^[a-f0-9]{64}$/.test(req.session.csrfToken || '')) {
        const before = { ...req.session }
        req.session.csrfToken = randomBytes(32).toString('hex')
        try { await saveSession(req, before, 'state') }
        catch (error) {
          if (error.code !== 'session_changed') throw error
          await reloadSession(req)
          if (!sameLogin(req.session, expected) || !/^[a-f0-9]{64}$/.test(req.session.csrfToken || '')) throw error
        }
      }
      if (!sameLogin(req.session, expected) || req.session.user.expires_at <= Date.now()) fail('not_authenticated')
      res.locals.csrfToken = req.session.csrfToken
      return next()
    } catch (error) {
      if (error?.code === 'not_authenticated' || invalidCredentials(error)) {
        if (invalidCredentials(error)) {
          try {
            await reloadSession(req)
            if (sameLogin(req.session, expected) && stamp(req.session) === stamp(expected)) await invalidateSession(req)
          } catch {}
        }
        req.session = null
        return reject('session_expired', 'session_expired')
      }
      return req.path?.startsWith('/api/') ? res.status(503).json({ error: 'authentication_unavailable' })
        : res.status(503).send('No se pudo verificar la sesión. Inténtalo de nuevo.')
    }
  }
}

const stateLocks = new WeakMap()
function consumeOAuthState(req, state) {
  if (typeof state !== 'string' || !/^[a-f0-9]{48}$/.test(state)) return Promise.reject(Object.assign(new Error('invalid_state'), { code: 'invalid_state' }))
  let locks = stateLocks.get(req.sessionStore)
  if (!locks) { locks = new Map(); stateLocks.set(req.sessionStore, locks) }
  const sid = req.sessionID
  const operation = (locks.get(sid) || Promise.resolve()).then(async () => {
    await reloadStored(req)
    if (req.session.oauthState !== state) fail('invalid_state')
    const before = { ...req.session }
    const returnTo = dashboardReturnTo(req.session.oauthReturnTo), pendingId = randomUUID()
    delete req.session.oauthState
    delete req.session.oauthReturnTo
    req.session.oauthPending = pendingId
    await saveSession(req, before, 'state')
    return { returnTo, pendingId }
  })
  const tail = operation.then(() => {}, () => {})
  locks.set(sid, tail)
  tail.then(() => { if (locks.get(sid) === tail) locks.delete(sid) })
  return operation
}

async function establishSession(req, user, { pendingId } = {}) {
  if (!validUser(user) || user.expires_at <= Date.now()) fail('not_authenticated')
  const rotation = pendingId ? req.sessionStore.beginRotation(req.sessionID) : null
  let release, rotated = false
  try {
    if (rotation) await rotation.regenerate(req, pendingId)
    else await callback(done => req.session.regenerate(done))
    rotated = true
    req.session.user = user
    req.session.authVersion = randomUUID()
    req.session.csrfToken = randomBytes(32).toString('hex')
    if (typeof req.sessionStore?.allowIssue !== 'function') fail('session_unavailable')
    release = req.sessionStore.allowIssue(req.sessionID, req.session)
    rotation?.check()
    await saveSession(req)
    rotation?.check()
  } catch (error) {
    if (rotated) { try { await invalidateSession(req) } catch {} }
    req.session = null
    if (error.code === 'session_revoked') fail('not_authenticated')
    throw error
  } finally { release?.(); rotation?.close() }
}

const dashboardReturnTo = value => value === '/app' ? '/app' : '/dashboard'
const publicUser = user => ({
  id: typeof user?.id === 'string' && /^\d{17,20}$/.test(user.id) ? user.id : null,
  username: String(user?.username || 'Usuario').slice(0, 80),
  global_name: typeof user?.global_name === 'string' ? user.global_name.slice(0, 80) : null,
  avatar: typeof user?.avatar === 'string' && /^(?:a_)?[a-f0-9]{32}$/.test(user.avatar) ? user.avatar : null
})
module.exports = { sessionAuth, establishSession, dashboardReturnTo, consumeOAuthState, reloadSession, saveSession, invalidateSession, validUser, publicUser, createSessionId, trackSessionIssuance }
