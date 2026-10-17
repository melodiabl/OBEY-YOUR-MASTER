// @ts-check
const { ConfigurationError } = require('./error')
const { renderWelcomeMessage } = require('../welcome-message')
const { contextSchema, draftSchema, publishSchema, saveSchema, previewSchema } = require('./contract')

/** @typedef {import('zod').infer<typeof contextSchema>} Context */
/** @typedef {import('./ports').DraftRepository} DraftRepository */
/** @typedef {import('./ports').PublishedRepository} PublishedRepository */
/** @typedef {{ authorize: (context: Context) => Promise<void>, channel: (context: Context, channelId: string | null) => Promise<void> }} Policy */

/**
 * @template T
 * @param {import('zod').ZodType<T>} schema
 * @param {unknown} value
 * @returns {T}
 */
function parse(schema, value) {
  const result = schema.safeParse(value)
  if (!result.success) throw new ConfigurationError('Solicitud de bienvenida inválida.', 'invalid_configuration')
  return result.data
}

/** @param {{ drafts: DraftRepository, published: PublishedRepository, policy: Policy }} dependencies */
function createWelcomeService({ drafts, published, policy }) {
  /** @param {unknown} value */
  async function authorize(value) {
    const context = parse(contextSchema, value)
    await policy.authorize(context)
    return context
  }
  return {
    /** @param {unknown} context */
    async read(context) {
      const { guildId } = await authorize(context)
      return drafts.read(guildId, 'welcome')
    },
    /** @param {unknown} context */
    async readPublished(context) {
      const { guildId } = await authorize(context)
      return published.read(guildId)
    },
    /** @param {unknown} context @param {unknown} input */
    async saveDraft(context, input) {
      const request = parse(draftSchema, input)
      const { guildId, actorId } = await authorize(context)
      return drafts.saveDraft(guildId, 'welcome', actorId, request.config, request.expectedDraftRevision, request.expectedPublishedRevision)
    },
    /** @param {unknown} context @param {unknown} input */
    async preview(context, input) {
      const { config } = parse(previewSchema, input)
      await authorize(context)
      return { fixture: true, content: renderWelcomeMessage(config.message,
        { username: 'Miembro de ejemplo', toString: () => '@Miembro de ejemplo' },
        { name: 'Servidor de ejemplo', memberCount: 42 }) }
    },
    /** @param {unknown} context @param {unknown} input */
    async publish(context, input) {
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
    },
    /** @param {unknown} context @param {unknown} input */
    async savePublished(context, input) {
      const request = parse(saveSchema, input)
      const actor = await authorize(context)
      const current = await published.read(actor.guildId)
      const channelId = Object.hasOwn(request.patch, 'channelId') ? request.patch.channelId : current.channelId
      await policy.channel(actor, channelId ?? null)
      return published.save(actor.guildId, request.patch, request.expectedRevision ?? current.revision, request.operationId)
    },
  }
}

module.exports = { createWelcomeService }
