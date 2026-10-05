(function (root) {
  const permissionOptions = [
    { key: 'ViewChannel', bit: '1024', label: 'Ver canales' },
    { key: 'SendMessages', bit: '2048', label: 'Enviar mensajes' },
    { key: 'ReadMessageHistory', bit: '65536', label: 'Leer historial' },
    { key: 'Connect', bit: '1048576', label: 'Conectarse a voz' },
    { key: 'Speak', bit: '2097152', label: 'Hablar en voz' },
    { key: 'ManageChannels', bit: '16', label: 'Administrar canales' },
    { key: 'ManageRoles', bit: '268435456', label: 'Administrar roles' },
    { key: 'ManageGuild', bit: '32', label: 'Administrar servidor' },
    { key: 'ViewAuditLog', bit: '128', label: 'Ver auditoría' },
    { key: 'Administrator', bit: '8', label: 'Administrador' },
  ]
  function setRolePermission(value, bit, enabled) {
    const current = BigInt(value), flag = BigInt(bit)
    return String(enabled ? current | flag : current & ~flag)
  }
  function setOverwritePermission(overwrites, roleId, bit, state) {
    if (!['allow', 'deny', 'inherit'].includes(state)) throw new Error('Invalid permission state')
    const result = structuredClone(overwrites), target = result.find(overwrite => overwrite.id === roleId && overwrite.type === 0) || { id: roleId, type: 0, allow: '0', deny: '0' }
    if (!result.includes(target)) result.push(target)
    target.allow = setRolePermission(target.allow, bit, state === 'allow')
    target.deny = setRolePermission(target.deny, bit, state === 'deny')
    return result.filter(overwrite => overwrite !== target || BigInt(target.allow) !== 0n || BigInt(target.deny) !== 0n).sort((a, b) => a.id.localeCompare(b.id))
  }
  function formatPermissions(value) {
    let remaining = BigInt(value), labels = []
    for (const option of permissionOptions) if (remaining & BigInt(option.bit)) { labels.push(option.label); remaining &= ~BigInt(option.bit) }
    if (remaining) labels.push(`Otros permisos: ${remaining}`)
    return labels.join(', ') || 'Ninguno'
  }
  const api = { permissionOptions, setRolePermission, setOverwritePermission, formatPermissions }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.architectPermissions = api
})(typeof window !== 'undefined' ? window : globalThis)
