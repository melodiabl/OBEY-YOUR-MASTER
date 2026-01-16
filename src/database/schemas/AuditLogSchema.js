const { Schema, model } = require('mongoose')

// Auditoría persistente. Ideal para trazabilidad y soporte.
const AuditLogSchema = new Schema({
  guildID: { type: String, required: true, index: true },
  actorID: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  targetID: { type: String, default: null, index: true },
  meta: { type: Schema.Types.Mixed, default: {} },
  ok: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now, index: true }
})

module.exports = model('AuditLog', AuditLogSchema)

