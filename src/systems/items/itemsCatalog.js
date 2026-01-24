module.exports = Object.freeze([
  // Basicos (tienda)
  { itemId: 'pan', name: 'Pan', description: 'Comida basica. (coleccionable)', type: 'consumable', buyPrice: 50, sellPrice: 25, meta: { emoji: '🍞' } },
  { itemId: 'hacha', name: 'Hacha', description: 'Herramienta de trabajo. (coleccionable)', type: 'permanent', buyPrice: 150, sellPrice: 75, meta: { emoji: '🪓' } },
  { itemId: 'cana', name: 'Cana', description: 'Cana de pesca. (coleccionable)', type: 'permanent', buyPrice: 200, sellPrice: 100, meta: { emoji: '🎣' } },
  { itemId: 'escudo', name: 'Escudo', description: 'Proteccion cosmetica. (coleccionable)', type: 'permanent', buyPrice: 300, sellPrice: 150, meta: { emoji: '🛡️' } },
  { itemId: 'elixir', name: 'Elixir', description: 'Consumible raro. (coleccionable)', type: 'consumable', buyPrice: 500, sellPrice: 250, meta: { emoji: '🧪' } },

  // Consumibles / especiales
  { itemId: 'potion_small', name: 'Pocion pequena', description: 'Consumible. (efecto: futuro sistema de usos)', type: 'consumable', buyPrice: 150, sellPrice: 75, meta: { emoji: '🧴' } },
  { itemId: 'ticket_boost', name: 'Ticket Boost', description: 'Consumible premium. (efecto: futuro sistema de boosts)', type: 'consumable', buyPrice: 500, sellPrice: 250, meta: { emoji: '🎟️' } },

  // Permanentes
  { itemId: 'badge_founder', name: 'Insignia Founder', description: 'Item permanente (cosmetico).', type: 'permanent', buyPrice: 2500, sellPrice: 500, meta: { emoji: '🏷️' } }
])
