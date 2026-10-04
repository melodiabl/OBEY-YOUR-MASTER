const { PermissionFlagsBits } = require('discord.js')

function commandDenial(client, member, name, track, { checkDj = false } = {}) {
  if (!member) return 'No se pudo comprobar tu pertenencia al servidor.'
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return null
  const settings = client.settings.get(member.guild.id) || {}
  const roles = settings.djroles || []
  const dj = roles.some(role => member.roles?.cache?.has(role))
  const info = track?.info || track
  const requester = String(info?.requesterId || info?.requester?.id || '') === member.id
  if ((settings.djonlycmds || []).includes(name) && !dj) return 'Este comando requiere un rol de DJ.'
  if ((settings.requestonlycmds || []).includes(name) && !requester) return 'Este comando está reservado al solicitante de la canción.'
  if (checkDj && track && roles.length && !dj && !requester) return 'Necesitas un rol de DJ o ser el solicitante de la canción.'
  return null
}

module.exports = { commandDenial }
