const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
function userSnapshot(user, id = user?.id) {
  if (!validId(id)) return undefined
  return { id, name: String(user?.globalName || user?.username || '').slice(0, 120), avatarURL: user?.displayAvatarURL?.({ size: 64, extension: 'png' }) }
}
function messageSnapshot(message, deleted = false) {
  let contextMessageId
  if (deleted && Number.isFinite(message.createdTimestamp)) {
    const previous = [...(message.channel?.messages?.cache?.values() || [])]
      .filter(item => validId(item.id) && item.channelId === message.channelId && item.id !== message.id && Number.isFinite(item.createdTimestamp) && item.createdTimestamp < message.createdTimestamp)
      .sort((a, b) => b.createdTimestamp - a.createdTimestamp)[0]
    contextMessageId = previous?.id
  }
  return { subject: userSnapshot(message.author), messageId: message.id, messageCreatedAt: message.createdTimestamp, contextMessageId }
}
const timeoutValue = value => value === null ? null : typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Date.parse(value) : Number.isFinite(value) ? value : undefined
module.exports = { validId, userSnapshot, messageSnapshot, timeoutValue }
