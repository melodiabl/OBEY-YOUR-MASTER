const { applyRoleMute, applyTimeoutMute, liftMute, parseDuration, MAX_TIMEOUT } = require('../application/role-mutes')

const messages = {
  es: {
    invalidTarget: 'Indica un miembro del servidor con una mención o su ID.',
    invalidDuration: 'Duración inválida. Usa, por ejemplo, 10m o 2h (máximo 28 días para timeout y 365 días para rol).',
    permission: 'No tienes permiso para usar este comando.',
    botPermission: 'Me faltan permisos para aplicar o retirar este silencio.',
    hierarchy: 'No puedo modificar a ese miembro por la jerarquía de roles.',
    accessUnconfirmed: 'No pude confirmar los permisos o el miembro. Inténtalo de nuevo.',
    roleUnavailable: 'El rol de silencio no existe o está por encima de mi rol. Revisa la configuración de mute.',
    roleFailed: 'No pude crear el rol de silencio.',
    overwriteFailed: 'No pude configurar el silencio en todos los canales. Revisa mis permisos y vuelve a intentarlo.',
    actionFailed: 'Discord rechazó el cambio. No lo he marcado como completado.',
    persistenceFailed: 'Discord aceptó el cambio, pero no pude guardarlo. Revisa el estado actual antes de repetirlo.',
    rollbackFailed: 'Discord aceptó el cambio, pero fallaron el guardado y la reversión. Revisa el estado actual antes de repetirlo.',
    stopping: 'El bot está reiniciándose. Vuelve a intentarlo en un momento.',
    notMuted: 'Ese miembro no tiene un silencio activo.',
    permaTimeout: 'El modo timeout no admite silencio permanente. Usa permamute para un rol permanente.',
    done: 'Silencio aplicado a ',
    lifted: 'Silencio retirado de ',
  },
  en: {
    invalidTarget: 'Provide a server member mention or ID.',
    invalidDuration: 'Invalid duration. Use 10m or 2h, for example (maximum 28 days for timeout and 365 days for a role).',
    permission: 'You do not have permission to use this command.',
    botPermission: 'I lack permission to apply or remove this mute.',
    hierarchy: 'Role hierarchy prevents me from changing this member.',
    accessUnconfirmed: 'I could not confirm permissions or the member. Try again.',
    roleUnavailable: 'The mute role is missing or above my role. Check mute settings.',
    roleFailed: 'I could not create the mute role.',
    overwriteFailed: 'I could not configure the mute in every channel. Check my permissions and try again.',
    actionFailed: 'Discord rejected the change. I have not marked it complete.',
    persistenceFailed: 'Discord accepted the change, but saving failed. Check the current state before retrying.',
    rollbackFailed: 'Discord accepted the change, but saving and reverting failed. Check the current state before retrying.',
    stopping: 'The bot is restarting. Try again shortly.',
    notMuted: 'That member has no active mute.',
    permaTimeout: 'Timeout mode cannot mute permanently. Use permamute for a permanent role mute.',
    done: 'Muted ',
    lifted: 'Unmuted ',
  },
}

function targetFromArgs(args) {
  const match = String(args[0] || '').match(/^(?:<@!?(\d{17,20})>|(\d{17,20}))$/)
  return match && (match[1] || match[2])
}

async function sendReceipt(client, message, command, targetId, reason, mode) {
  const options = { allowedMentions: { parse: [] } }
  const id = client.settings.get(message.guild.id, 'adminlog')
  if (id && id !== 'no') {
    const channel = await message.guild.channels.fetch(id).catch(() => null)
    if (channel?.isTextBased()) {
      const content = [command, 'actor=' + message.author.id, 'target=' + targetId,
        'mode=' + mode, reason && 'reason=' + reason].filter(Boolean).join(' | ').slice(0, 1900)
      await channel.send({ content, ...options }).catch(() => {})
    }
  }
  if (command !== 'unmute') {
    const user = await client.users.fetch(targetId).catch(() => null)
    if (user) await user.send({ content: 'OBEY: ' + command + ' en ' + message.guild.name +
      (reason ? ' | ' + reason : ''), ...options }).catch(() => {})
  }
}

async function runPrefixRoleMute(client, message, args, command) {
  const locale = String(client.settings.get(message.guild.id, 'language') || 'es').startsWith('en') ? 'en' : 'es'
  const words = messages[locale]
  const reply = content => message.reply({ content, allowedMentions: { parse: [] } })
  const targetId = targetFromArgs(args)
  if (!targetId) return reply(words.invalidTarget)
  const settings = client.settings.get(message.guild.id, 'mute') || {}
  let result, reason = ''
  if (command === 'unmute') {
    reason = args.slice(1).join(' ').slice(0, 512)
    result = await liftMute(client, { guild: message.guild, actorId: message.author.id, targetId, reason })
  } else {
    const permanent = command === 'permamute' || command === 'mute' && /^perma(?:nent)?$/i.test(args[1] || '')
    const roleMode = command !== 'mute' || settings.style === 'role'
    if (permanent && !roleMode) return reply(words.permaTimeout)
    let duration
    if (permanent) duration = -1
    else if (args[1]) duration = parseDuration(args[1])
    else duration = settings.defaultTime
    if (!Number.isSafeInteger(duration) || duration < 1 ||
        duration > (roleMode ? 365 * 86400000 : MAX_TIMEOUT)) return reply(words.invalidDuration)
    reason = args.slice(command === 'permamute' ? 1 : 2).join(' ').slice(0, 512)
    const input = { guild: message.guild, actorId: message.author.id, targetId,
      command, duration, reason, channelId: message.channel.id }
    result = roleMode ? await applyRoleMute(client, input) : await applyTimeoutMute(client, input)
  }
  if (result.status !== 'applied') return reply(words[result.status] || words.actionFailed)
  const done = (command === 'unmute' ? words.lifted : words.done) + targetId + '.'
  await reply(done).catch(() => {})
  if (command !== 'unmute') {
    try { client.stats.push(message.guild.id + message.author.id, Date.now(), 'mute') } catch {}
  }
  await sendReceipt(client, message, command, targetId, reason, result.mode)
}

module.exports = { runPrefixRoleMute }
