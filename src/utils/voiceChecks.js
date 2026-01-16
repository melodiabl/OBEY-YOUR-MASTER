function isSoundCloudUrl (input) {
  const q = String(input || '').trim().toLowerCase()
  return q.includes('soundcloud.com') || q.includes('snd.sc')
}

function getMemberVoiceChannel (member) {
  return member?.voice?.channel || null
}

function botHasVoicePerms (voiceChannel, me) {
  const member = (me && me.user) ? me : (voiceChannel?.guild?.members?.me || null)
  const perms = voiceChannel?.permissionsFor(member) || null
  return {
    ok: !!perms && perms.has('Connect') && perms.has('Speak'),
    perms
  }
}

module.exports = {
  isSoundCloudUrl,
  getMemberVoiceChannel,
  botHasVoicePerms
}
