const { publicUser } = require('./auth')
const { sanitizeGuilds } = require('./permissions')
function createDiscordOAuth(axios, { clientId, clientSecret, redirectUri }) {
  const options = { timeout: 10000, maxRedirects: 0, maxContentLength: 1024 * 1024 }
  const post = (endpoint, parameters) => axios.post(`https://discord.com/api/oauth2/${endpoint}`, new URLSearchParams({
    client_id: clientId, client_secret: clientSecret, ...parameters
  }), { ...options, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  const get = (endpoint, token) => axios.get(`https://discord.com/api/${endpoint}`, {
    ...options, timeout: 5000, headers: { Authorization: `Bearer ${token}` }
  })
  async function fetchGuilds(token) { return sanitizeGuilds((await get('users/@me/guilds', token)).data) }
  async function resolve(parameters, previous) {
    const token = (await post('token', parameters)).data
    if (typeof token?.access_token !== 'string' || !token.access_token || typeof token.refresh_token !== 'string' || !token.refresh_token ||
      !Number.isSafeInteger(token.expires_in) || token.expires_in <= 0 || token.expires_in > 30 * 86400 ||
      String(token.token_type).toLowerCase() !== 'bearer') throw new Error('invalid_oauth_response')
    const [profile, guilds] = await Promise.all([get('users/@me', token.access_token), fetchGuilds(token.access_token)])
    const user = publicUser(profile.data)
    if (!user.id || previous && user.id !== previous.id) throw Object.assign(new Error('not_authenticated'), { code: 'not_authenticated' })
    return { ...user, guilds, access_token: token.access_token, refresh_token: token.refresh_token,
      expires_at: Date.now() + token.expires_in * 1000, logged_in_at: previous?.logged_in_at ?? Date.now(), guilds_fetched_at: Date.now() }
  }
  return {
    fetchGuilds,
    exchange: code => resolve({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
    refresh: user => {
      if (!user.refresh_token) return Promise.reject(Object.assign(new Error('not_authenticated'), { code: 'not_authenticated' }))
      return resolve({ grant_type: 'refresh_token', refresh_token: user.refresh_token }, user)
    },
    revoke: token => post('token/revoke', { token })
  }
}
module.exports = { createDiscordOAuth }
