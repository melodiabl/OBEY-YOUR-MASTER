const { Schema, model } = require('mongoose')

// Overrides de autorización por miembro (por servidor).
// Esto permite roles/permisos internos sin depender solo de roles de Discord.
const MemberAuthSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    userID: { type: String, required: true, index: true },

    // OWNER se define a nivel global por OWNER_IDS; aquí se usan ADMIN/MOD/USER u otros futuros.
    role: { type: String, default: null },

    // Permisos internos puntuales (allow/deny) por usuario.
    permissionsGranted: { type: Array, default: [] },
    permissionsDenied: { type: Array, default: [] }
  },
  { timestamps: true }
)

MemberAuthSchema.index({ guildID: 1, userID: 1 }, { unique: true })

module.exports = model('MemberAuth', MemberAuthSchema)
