const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { PET_TYPES, getPet, adoptPet, abandonPet, feedPet, playWithPet, renamePet, healPet } = require('../../systems/pets/petService')

module.exports = createSystemSlashCommand({
  name: 'pets',
  description: 'Mascotas/companions (base escalable)',
  moduleKey: 'pets',
  defaultCooldownMs: 2_000,
  subcommands: [
    {
      name: 'adopt',
      description: 'Adopta una mascota',
      options: [
        {
          apply: (sc) =>
            sc
              .addStringOption(o =>
                o
                  .setName('tipo')
                  .setDescription('Tipo')
                  .setRequired(true)
                  .addChoices(...PET_TYPES.map(t => ({ name: t, value: t })))
              )
              .addStringOption(o => o.setName('nombre').setDescription('Nombre').setRequired(true).setMinLength(2).setMaxLength(20))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const type = interaction.options.getString('tipo', true)
        const name = interaction.options.getString('nombre', true)
        const pet = await adoptPet({ client, userID: interaction.user.id, type, name })
        return interaction.reply({ content: `ƒo. Adoptaste un **${pet.type}** llamado **${pet.name}**.`, ephemeral: true })
      }
    },
    {
      name: 'status',
      description: 'Estado de tu mascota',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario (opcional)').setRequired(false)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario') || interaction.user
        const { pet, hasPet } = await getPet({ client, userID: user.id })
        if (!hasPet) return interaction.reply({ content: 'No tiene mascota.', ephemeral: true })
        const embed = new EmbedBuilder()
          .setTitle(`🐾 Mascota • ${user.username}`)
          .setColor('Green')
          .addFields(
            { name: 'Nombre', value: pet.name || 'Sin nombre', inline: true },
            { name: 'Tipo', value: pet.type, inline: true },
            { name: 'Salud', value: `${pet.health}/100`, inline: true },
            { name: 'Felicidad', value: `${pet.happiness}/100`, inline: true },
            { name: 'Nivel', value: String(pet.level), inline: true },
            { name: 'XP', value: String(pet.xp), inline: true }
          )
          .setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'feed',
      description: 'Alimenta a tu mascota (cooldown)',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const pet = await feedPet({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: `ƒo. Alimentaste a **${pet.name}**. Salud: ${pet.health}/100 • Felicidad: ${pet.happiness}/100 • Nivel: ${pet.level}`, ephemeral: true })
      }
    },
    {
      name: 'play',
      description: 'Juega con tu mascota (cooldown)',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const pet = await playWithPet({ client, userID: interaction.user.id })
        return interaction.reply({ content: `ƒo. Jugaste con **${pet.name}**. Felicidad: ${pet.happiness}/100 • Nivel: ${pet.level}`, ephemeral: true })
      }
    },
    {
      name: 'rename',
      description: 'Cambia el nombre de tu mascota',
      options: [{ apply: (sc) => sc.addStringOption(o => o.setName('nombre').setDescription('Nuevo nombre').setRequired(true).setMinLength(2).setMaxLength(20)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const name = interaction.options.getString('nombre', true)
        const pet = await renamePet({ client, userID: interaction.user.id, name })
        return interaction.reply({ content: `ƒo. Nuevo nombre: **${pet.name}**`, ephemeral: true })
      }
    },
    {
      name: 'heal',
      description: 'Cura a tu mascota (costo: 250)',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const res = await healPet({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        return interaction.reply({ content: `ƒo. Curaste a tu mascota por **${res.price}**. Salud: ${res.pet.health}/100`, ephemeral: true })
      }
    },
    {
      name: 'abandon',
      description: 'Abandona tu mascota (irreversible)',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        await abandonPet({ client, userID: interaction.user.id })
        return interaction.reply({ content: 'ƒo. Mascota abandonada.', ephemeral: true })
      }
    }
  ]
})

