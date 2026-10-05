(function (root) {
  function sameOverwrites(a, b) {
    const canonical = list => JSON.stringify((list || []).map(item => ({ id: item.id, type: item.type,
      allow: BigInt(item.allow).toString(), deny: BigInt(item.deny).toString() })).sort((a, b) => a.id.localeCompare(b.id)))
    return canonical(a) === canonical(b)
  }
  function syncedChildren(snapshot, category) {
    const permissions = channel => (channel.overwrites || []).filter(overwrite =>
      !(overwrite.id === snapshot.guildId && BigInt(overwrite.allow) === 0n && BigInt(overwrite.deny) === 0n))
    return snapshot.channels.filter(channel => channel.parentId === category.id && sameOverwrites(permissions(channel), permissions(category)))
      .sort((a, b) => a.id.localeCompare(b.id))
  }
  const api = { sameOverwrites, syncedChildren }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.architectSync = api
})(typeof window !== 'undefined' ? window : globalThis)
