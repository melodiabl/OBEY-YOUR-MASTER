const { sameOverwrites, syncedChildren } = require('../../dashboard/public/js/architect-sync')
function categoryCascade(source, blueprint, change) {
  const category = source.channels.find(channel => channel.id === change.id)
  const children = syncedChildren(source, category)
  const protectedIds = new Set(blueprint.protectedIds || [])
  return { cascadeIds: children.map(child => child.id), cascadeValid: children.every(child => {
    const proposed = blueprint.channels.find(channel => channel.id === child.id)
    return [0, 2].includes(child.type) && !protectedIds.has(child.id) && proposed?.parentId === category.id && sameOverwrites(proposed.overwrites, change.after)
  }) }
}
function projectCategoryPermissions(state, operation, idMap = {}) {
  const category = state.channels.find(channel => channel.id === operation.resourceId)
  if (category?.type !== 4 || !Array.isArray(operation.cascadeIds)) throw new Error('Category cascade unknown')
  const overwrites = operation.fields.overwrites.map(overwrite => ({ ...overwrite, id: idMap[overwrite.id] || overwrite.id })).sort((a, b) => a.id.localeCompare(b.id))
  // Once applied, formerly custom children can now match. Do not reinterpret a completed step.
  if (sameOverwrites(category.overwrites, overwrites)) return
  const ids = syncedChildren(state, category).map(child => child.id)
  if (JSON.stringify(ids) !== JSON.stringify(operation.cascadeIds)) throw new Error('Category cascade changed')
  for (const id of [category.id, ...ids]) state.channels.find(channel => channel.id === id).overwrites = structuredClone(overwrites)
}
module.exports = { categoryCascade, projectCategoryPermissions, syncedChildren }
