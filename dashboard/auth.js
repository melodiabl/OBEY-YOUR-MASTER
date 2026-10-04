function sessionAuth(refreshSession) {
  return async (req, res, next) => {
    const reject = (reason, error) => req.path?.startsWith('/api/')
      ? res.status(401).json({ error }) : res.redirect(`/login?reason=${reason}`)
    const user = req.session?.user
    if (!user?.id || !Number.isFinite(user.expires_at)) return reject('not_logged_in', 'not_authenticated')
    if (Date.now() > user.expires_at - 3600000) {
      try {
        await refreshSession(req.session)
        if (!req.session.user?.id || !(req.session.user.expires_at > Date.now())) throw new Error('invalid_refresh')
      } catch {
        req.session.destroy(() => {})
        return reject('session_expired', 'session_expired')
      }
    }
    return next()
  }
}

async function establishSession(req, user) {
  await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()))
  req.session.user = user
  await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()))
}

module.exports = { sessionAuth, establishSession }
