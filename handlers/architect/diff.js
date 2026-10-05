const { createHash } = require('node:crypto')
function diffBlueprint(source, blueprint) {
  const changes = []
  for (const kind of ['roles', 'channels']) {
    const previous = new Map(source[kind].map(resource => [resource.id, resource]))
    for (const resource of blueprint[kind]) {
      const before = previous.get(resource.id)
      if (!before) { changes.push({ operation: 'create', kind, id: resource.id, before: null, after: resource }); continue }
      for (const field of Object.keys(resource)) {
        if (['id', 'parentId', 'position'].includes(field)) continue
        if (JSON.stringify(before[field]) !== JSON.stringify(resource[field])) changes.push({
          operation: field === 'overwrites' ? 'overwrites' : 'update', kind, id: resource.id, field, before: before[field], after: resource[field],
          ...(field === 'overwrites' ? { resourceType: resource.type } : {}),
        })
      }
      if (before.parentId !== resource.parentId || before.position !== resource.position) changes.push({
        operation: 'move', kind, id: resource.id, before: kind === 'roles' ? { position: before.position } : { parentId: before.parentId ?? null, position: before.position },
        after: kind === 'roles' ? { position: resource.position } : { parentId: resource.parentId ?? null, position: resource.position },
        ...(kind === 'channels' ? { resourceType: resource.type } : {}),
      })
    }
  }
  const revision = createHash('sha256').update(JSON.stringify(blueprint)).digest('hex')
  return { baseRevision: source.revision, revision, changes, counts: Object.fromEntries(['create', 'update', 'move', 'overwrites'].map(operation => [operation, changes.filter(change => change.operation === operation).length])) }
}
module.exports = { diffBlueprint }
