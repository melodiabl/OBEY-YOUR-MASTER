// @ts-check
const { ConfigurationError } = require('./error')
const { renderWelcomeMessage } = require('../welcome-message')
const { contextSchema, draftSchema, publishSchema, saveSchema, previewSchema } = require('./contract')

/** @typedef {import('zod').infer<typeof contextSchema>} Context */
/** @typedef {import('./ports').DraftRepository} DraftRepository */
/** @typedef {import('./ports').PublishedRepository} PublishedRepository */
/** @typedef {{
 * authorize: (context: Context) => Promise<void>,
 * channel: (context: Context, channelId: string | null) => Promise<void>,
 * channels?: (context: Context) => Promise<Array<{id: string, name: string}>>
 * }} Policy */

/**
 * @template T
 * @param {import('zod').ZodType<T>} schema
 * @param {unknown} value
 * @returns {T}
 */
function parse(schema, value) {
  const result = schema.safeParse(value)
  if (!result.success) {
    const error = new ConfigurationError('Solicitud de bienvenida inválida.', 'invalid_configuration')
    error.fields = [...new Set(result.error.issues.flatMap(issue => {
      const field = issue.path.at(-1)
      return field === 'channelId' || field === 'message' ? [field] : []
    }))]
    throw error
  }
  return result.data
}

/** @param {{ drafts: DraftRepository, published: PublishedRepository, policy: Policy, isStopping?: () => boolean }} dependencies */
function createWelcomeService({ drafts, published, policy, isStopping = () => false }) {
  let stopping = false, inFlight = 0
  /** @type {Promise<void> | undefined} */
  let draining
  /** @type {(() => void) | undefined} */
  let resolveDrain
  /** @template T @param {() => Promise<T>} execute @returns {Promise<T>} */
  async function run(execute) {
    if (isStopping()) stopping = true
    if (stopping) throw new ConfigurationError('La configuración se está cerrando.', 'configuration_unavailable')
    inFlight++
    try { return await execute() }
    finally { inFlight--; if (stopping && !inFlight) resolveDrain?.() }
  }
  function drain() {
    stopping = true
    return draining ||= inFlight ? new Promise(resolve => { resolveDrain = resolve }) : Promise.resolve()
  }
  /** @param {unknown} value */
  async function authorize(value) {
    const context = parse(contextSchema, value)
    await policy.authorize(context)
    return context
  }
  return {
    drain,
    lifecycleState() {
      if (!stopping && !isStopping()) return { phase: 'accepting', inFlight }
      return { phase: inFlight ? 'draining' : 'stopped', inFlight }
    },
    /** @param {unknown} context */
    async read(context) {
      return run(async () => {
        const { guildId } = await authorize(context)
        return drafts.read(guildId, 'welcome')
      })
    },
    /** @param {unknown} context */
    async readPublished(context) {
      return run(async () => {
        const { guildId } = await authorize(context)
        return published.read(guildId)
      })
    },
    /** @param {unknown} context */
    async channels(context) {
      return run(async () => {
        const actor = parse(contextSchema, context)
        if (!policy.channels) throw new ConfigurationError('Canales no disponibles.', 'configuration_unavailable')
        // This policy revalidates the actor and projects visible channels together.
        return { channels: await policy.channels(actor) }
      })
    },
    /** @param {unknown} context @param {unknown} input */
    async saveDraft(context, input) {
      return run(async () => {
        const request = parse(draftSchema, input)
        const { guildId, actorId } = await authorize(context)
        return drafts.saveDraft(guildId, 'welcome', actorId, request.config, request.expectedDraftRevision, request.expectedPublishedRevision)
      })
    },
    /** @param {unknown} context @param {unknown} input */
    async preview(context, input) {
      return run(async () => {
        const { config } = parse(previewSchema, input)
        await authorize(context)
        return { fixture: true, content: renderWelcomeMessage(config.message,
          { username: 'Miembro de ejemplo', toString: () => '@Miembro de ejemplo' },
          { name: 'Servidor de ejemplo', memberCount: 42 }) }
      })
    },
    /** @param {unknown} context @param {unknown} input */
    async publish(context, input) {
      return run(async () => {
        const request = parse(publishSchema, input)
        const actor = await authorize(context)
        const current = await drafts.read(actor.guildId, 'welcome')
        if (current.draft?.revision === request.draftRevision) {
          await policy.channel(actor, current.draft.config.channelId)
        } else if (current.lastPublication?.operationId !== request.operationId) {
          throw new ConfigurationError('El borrador cambió.', 'configuration_conflict')
        }
        // The existing writer checks actor, payload, draft and published revision atomically.
        return drafts.publish(actor.guildId, 'welcome', actor.actorId, request.draftRevision, request.expectedPublishedRevision, request.operationId)
      })
    },
    /** @param {unknown} context @param {unknown} input */
    async savePublished(context, input) {
      return run(async () => {
        const request = parse(saveSchema, input)
        const actor = await authorize(context)
        const current = await published.read(actor.guildId)
        const channelId = Object.hasOwn(request.patch, 'channelId') ? request.patch.channelId : current.channelId
        await policy.channel(actor, channelId ?? null)
        return published.save(actor.guildId, request.patch, request.expectedRevision ?? current.revision, request.operationId)
      })
    },
  }
}

module.exports = { createWelcomeService }
