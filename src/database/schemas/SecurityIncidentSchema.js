const { Schema, model } = require('mongoose')

// Incidentes de seguridad persistentes (anti-raid / anti-nuke / alt / comportamiento).
const SecurityIncidentSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true }, // raid | nuke | alt | behavior
    severity: { type: String, default: 'med', index: true }, // low | med | high
    actorID: { type: String, default: null, index: true }, // quien provocÃ³ / ejecutor
    targetID: { type: String, default: null, index: true }, // afectado (si aplica)
    meta: { type: Schema.Types.Mixed, default: {} },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
)

module.exports = model('SecurityIncident', SecurityIncidentSchema)

