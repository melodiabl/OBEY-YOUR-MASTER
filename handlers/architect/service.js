const { snapshotGuild } = require('./snapshot')
const { validateBlueprint, BlueprintError } = require('./blueprint')
const { diffBlueprint } = require('./diff')
const { preflight } = require('./preflight')
function createArchitectService({ snapshot = snapshotGuild, repository, storageReady = () => true, applyAvailable = () => false } = {}) {
  return {
    catalog: () => require('./wizard').wizardCatalog(),
    async decorate(guild, actorId, input, choices) {
      const current = await snapshot(guild), initial = validateBlueprint(input, current)
      const result = require('./decoration').decorateProposal(initial, current, choices)
      const blueprint = validateBlueprint(result.blueprint, current), diff = diffBlueprint(current, blueprint)
      return { snapshot: current, blueprint, diff, decoration: result.decoration,
        preflight: await preflight(guild, blueprint, diff, actorId, { executionAvailable: Boolean(applyAvailable(guild)), observed: current }) }
    },
    async generate(guild, actorId, input, options) {
      const current = await snapshot(guild)
      const initial = validateBlueprint(input, current)
      const generated = require('./wizard').generateProposal(initial, options)
      const blueprint = validateBlueprint(generated.blueprint, current)
      const diff = diffBlueprint(current, blueprint)
      return { snapshot: current, blueprint, diff, wizard: generated.wizard,
        preflight: await preflight(guild, blueprint, diff, actorId, { executionAvailable: Boolean(applyAvailable(guild)), observed: current }) }
    },
    async read(guild, actorId) {
      const current = await snapshot(guild)
      const draft = repository && storageReady() ? await repository.get(guild.id, actorId) : null
      return { snapshot: current, draft, draftStale: Boolean(draft && draft.blueprint.baseRevision !== current.revision), storageAvailable: Boolean(repository && storageReady()), applyAvailable: Boolean(applyAvailable(guild)), wizardCatalog: require('./wizard').wizardCatalog(), decorationCatalog: require('./decoration').decorationCatalog() }
    },
    async preview(guild, input, actorId) {
      const current = await snapshot(guild)
      const blueprint = validateBlueprint(input, current)
      const diff = diffBlueprint(current, blueprint)
      return { snapshot: current, blueprint, diff, preflight: await preflight(guild, blueprint, diff, actorId, { executionAvailable: Boolean(applyAvailable(guild)), observed: current }) }
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
