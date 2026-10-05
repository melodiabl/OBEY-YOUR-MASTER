(function (root) {
  function createEditorState(source, draft) {
    let value = structuredClone(draft || { schemaVersion: 1, baseRevision: source.revision,
      channels: source.channels, roles: source.roles, protectedIds: [] })
    const history = [], future = []
    const automatic = new Set([...source.roles.filter(role => role.managed || role.id === source.guildId).map(role => role.id),
      ...source.channels.filter(channel => ![0, 2, 4].includes(channel.type)).map(channel => channel.id)])
    function protectedResource(id) { return automatic.has(id) || value.protectedIds.includes(id) }
    return {
      current: () => structuredClone(value),
      protected: protectedResource,
      change(edit) {
        const next = structuredClone(value)
        edit(next)
        for (const item of [...value.channels, ...value.roles]) {
          if (protectedResource(item.id) && JSON.stringify(item) !== JSON.stringify([...next.channels, ...next.roles].find(resource => resource.id === item.id))) return false
        }
        if (JSON.stringify(next) === JSON.stringify(value)) return false
        history.push(value); if (history.length > 20) history.shift()
        value = next; future.length = 0
        return true
      },
      undo() { if (!history.length) return false; future.push(value); value = history.pop(); return true },
      redo() { if (!future.length) return false; history.push(value); value = future.pop(); return true },
      remove(id) {
        if (!id.startsWith('local:') || protectedResource(id) || value.channels.some(channel => channel.parentId === id)
          || value.channels.some(channel => channel.overwrites?.some(overwrite => overwrite.id === id))) return false
        return this.change(next => { next.channels = next.channels.filter(item => item.id !== id); next.roles = next.roles.filter(item => item.id !== id) })
      },
      move(kind, id, direction) {
        if (!['channels', 'roles'].includes(kind) || ![-1, 1].includes(direction) || protectedResource(id)) return false
        const item = value[kind].find(resource => resource.id === id)
        if (!item) return false
        const siblings = value[kind].filter(resource => kind === 'roles' || (resource.parentId === item.parentId && resource.type === item.type))
          .sort((a, b) => (kind === 'roles' ? b.position - a.position : a.position - b.position) || a.id.localeCompare(b.id))
        const index = siblings.indexOf(item), neighbor = siblings[index + direction]
        if (!neighbor || protectedResource(neighbor.id) || neighbor.position === item.position) return false
        return this.change(next => {
          next[kind].find(resource => resource.id === id).position = neighbor.position
          next[kind].find(resource => resource.id === neighbor.id).position = item.position
        })
      },
      get canUndo() { return history.length > 0 },
      get canRedo() { return future.length > 0 },
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createEditorState }
  else root.createArchitectEditorState = createEditorState
})(typeof window !== 'undefined' ? window : globalThis)
