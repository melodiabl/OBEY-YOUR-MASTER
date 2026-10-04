const { snapshotGuild } = require('./snapshot')
const { validateBlueprint, BlueprintError } = require('./blueprint')
const { diffBlueprint } = require('./diff')
const { preflight } = require('./preflight')
function createArchitectService({ snapshot = snapshotGuild, repository, storageReady = () => true } = {}) {
  return {
    async read(guild, actorId) {
      const current = await snapshot(guild)
      const draft = repository && storageReady() ? await repository.get(guild.id, actorId) : null
      return { snapshot: current, draft, draftStale: Boolean(draft && draft.blueprint.baseRevision !== current.revision), storageAvailable: Boolean(repository && storageReady()) }
    },
    async preview(guild, input, actorId) {
      const current = await snapshot(guild)
      const blueprint = validateBlueprint(input, current)
      const diff = diffBlueprint(current, blueprint)
      return { snapshot: current, blueprint, diff, preflight: await preflight(guild, blueprint, diff, actorId) }
    },
    async save(guild, actorId, input, expectedRevision) {
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new BlueprintError('Invalid draft revision')
      if (!repository || !storageReady()) throw new BlueprintError('Draft storage unavailable', 'storage_unavailable')
      const proposal = await this.preview(guild, input, actorId)
      const saved = await repository.save(guild.id, actorId, { snapshot: proposal.snapshot, blueprint: proposal.blueprint }, expectedRevision)
      return { ...proposal, draftRevision: saved.draftRevision, savedAt: saved.updatedAt || null }
    },
  }
}
module.exports = { createArchitectService }
