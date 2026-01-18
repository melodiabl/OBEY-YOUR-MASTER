const { Schema, model } = require('mongoose')

// Items "definidos" por el bot (catálogo) + compras/ventas registradas.
const ItemSchema = new Schema(
  {
    itemId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, default: 'consumable' }, // consumable | permanent | crate
    buyPrice: { type: Number, default: 0 },
    sellPrice: { type: Number, default: 0 },
    meta: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
)

module.exports = model('Item', ItemSchema)
