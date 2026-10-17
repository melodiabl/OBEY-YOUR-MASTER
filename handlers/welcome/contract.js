// @ts-check
const { z } = require('zod')

const identifier = z.string().regex(/^[a-zA-Z0-9_:-]{1,100}$/)
const revision = z.string().regex(/^[a-f0-9]{64}$/)
const operationId = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/)
const draftRevision = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
const configSchema = z.strictObject({ channelId: identifier.nullable(), message: z.string().max(500) })
const contextSchema = z.strictObject({ guildId: identifier, actorId: identifier })
const patchSchema = configSchema.partial().refine(value => Object.keys(value).length > 0 && Object.values(value).every(field => field !== undefined))
const draftSchema = z.strictObject({
  config: configSchema,
  expectedDraftRevision: draftRevision,
  expectedPublishedRevision: revision,
})
const publishSchema = z.strictObject({
  draftRevision: draftRevision.min(1), expectedPublishedRevision: revision, operationId,
})
const saveSchema = z.strictObject({
  patch: patchSchema, expectedRevision: revision.optional(), operationId: operationId.optional(),
})
const previewSchema = z.strictObject({ config: configSchema })

// Export the serializable configuration only; policies remain on the server.
const configJsonSchema = z.toJSONSchema(configSchema)

module.exports = { contextSchema, configSchema, configJsonSchema, patchSchema, draftSchema, publishSchema, saveSchema, previewSchema }
