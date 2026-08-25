const Discord = require("discord.js");
const { ButtonStyle } = require("discord.js");
const Platforms = {
    pc: "PC",
    psn: "Playstation",
    xbl: "Xbox",
};
const fortnite = require("fortnite");
module.exports = async client => {
    const EnmapLike = require('./enmap-like'); client.epicgamesDB = new EnmapLike();

    client.on("interactionCreate", async interaction => {
        if (!interaction.isButton()) return;
        if (interaction.message.author.id != client.user.id) return;
        if (!interaction.customId.includes("epicgamesverify")) return;
        let { user, guildId } = interaction;
        client.epicgamesDB.ensure(user.id, {
            epic: "",
            user: user.id,
            guild: guildId,
            Platform: "",
            InputMethod: "",
        });
        client.epicgamesDB.ensure(guildId, {
            logChannel: "",
            verifychannel: "",
        });
        const guild = client.guilds.cache.get(guildId);
        let data = client.epicgamesDB.get(user.id);
        let guilddata = client.epicgamesDB.get(guildId);
        if (
            guilddata.verifychannel == interaction.channelId &&
            interaction.customId == "epicgamesverify" &&
            data.epic &&
            data.epic.length > 5
        ) {
            interaction.reply({
                content: `:question: **You already connected your EpicGames Account to __${guild.name}__**\n> Do you want to change it?\n**Name:** \`${data.epic}\`\n**Platform:** \`${Platforms[data.Platform]}\`\n**Input Method:** \`${data.InputMethod}\``,
                ephemeral: true,
                components: [
                    new Discord.ActionRowBuilder().addComponents([
                        new Discord.ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji("✋")
                            .setLabel("Yes Change it!")
                            .setCustomId("epicgamesverify_f"),
                        new Discord.ButtonBuilder()
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji("✋")
                            .setLabel("No I want to keep it!")
                            .setCustomId("no"),
                    ]),
                ],
            });
        } else {
            //else force Create it!
            user.send({
                content: `:question: **Seleccionar your Platform**\n> Where do you play on?`,
                components: [
                    new Discord.ActionRowBuilder().addComponents([
                        new Discord.StringSelectMenuBuilder()
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Selecciona la plataforma")
                            .setCustomId("Platform")
                            .addOptions([
                                {
                                    label: "PC | Computadora",
                                    value: "pc",
                                    description: "Si juegas en computadora/portátil",
                                    emoji: "🖥️",
                                },
                                {
                                    label: "Playstation",
                                    value: "psn",
                                    description: "Si juegas en una PlayStation",
                                    emoji: "🎮",
                                },
                                {
                                    label: "Xbox",
                                    value: "xbl",
                                    description: "Si juegas en una Xbox",
                                    emoji: "🎮",
                                },
                                {
                                    label: "Others",
                                    value: "others",
                                    description: "Si juegas en otra cosa...",
                                },
                            ]),
                    ]),
                ],
            })
                .then(async msg => {
                    interaction.reply({
                        content: "👍 **¡Revisa tus mensajes directos! Y responde mis preguntas**",
                        ephemeral: true,
                    });
                    let Platform =
                        (await msg.channel
                            .awaitMessageComponent({
                                filter: i => i.user.id === user.id,
                                time: 120_000,
                                max: 1,
                                errors: ["time"],
                            })
                            .then(i => {
                                i.deferUpdate().catch(() => {});
                                return i.values[0];
                            })
                            .catch(() => {})) || false;
                    if (!Platform) {
                        return user.send("❌ Cancelado, por no reaccionar en menos de 2 minutos");
                    }
                    user.send(
                        `:question: **¿Cuál es tu nombre de usuario de EPIC GAMES?**\n> Asegúrate de enviar solo el nombre de usuario tal cual aparece en \`Epicgames.com\``
                    );
                    let Username =
                        (await msg.channel
                            .awaitMessages({ filter: m => m.author.id === user.id, time: 120_000, max: 1, errors: ["time"] })
                            .then(c => c.first()?.content)
                            .catch(() => {})) || false;
                    if (!Username) {
                        return user.send("❌ Cancelado, por no enviar el nombre de usuario en menos de 2 minutos");
                    }
                    let others = client.epicgamesDB.find(d => d.guild && d.guild == guildId && d.epic && d.epic == Username);
                    if (others && others.length > 0)
                        return user.send(
                            `❌ **Alguien con la ID de usuario: \`${others.user}\` ¡Vinculó su cuenta con este nombre de Epic Games!**`
                        );
                    let fortniteClient = new fortnite("e032828b-886d-4ed6-9aa1-0e2e725592a8");
                    let tdata =
                        (await fortniteClient.user(Username, Platform == "others" ? "pc" : Platform).catch(() => {})) ||
                        false;
                    if (!tdata || tdata.code === 404) {
                        return user.send(
                            "❌ No se pudo encontrar tu cuenta de Epic Games, inténtalo de nuevo y asegúrate de enviar el nombre correcto"
                        );
                    }
                    client.epicgamesDB.set(user.id, Username, "epic");
                    client.epicgamesDB.set(user.id, Platform, "Platform");
                    user.send({
                        content: `:question: **Seleccionar your Platform**\n> Where do you play on?`,
                        components: [
                            new Discord.ActionRowBuilder().addComponents([
                                new Discord.StringSelectMenuBuilder()
                                    .setMaxValues(1)
                                    .setMinValues(1)
                                    .setPlaceholder("Selecciona la plataforma")
                                    .setCustomId("Platform")
                                    .addOptions([
                                        {
                                            label: "Teclado y ratón",
                                            value: "kbm",
                                            description: "Si juegas con teclado y ratón",
                                            emoji: "⌨️",
                                        },
                                        {
                                            label: "Controller",
                                            value: "controller",
                                            description: "Si juegas con un control",
                                            emoji: "🎮",
                                        },
                                        {
                                            label: "Touch",
                                            value: "touch",
                                            description: "Si juegas en un dispositivo táctil",
                                            emoji: "📱",
                                        },
                                        {
                                            label: "Others",
                                            value: "others",
                                            description: "Si juegas en otra cosa...",
                                        },
                                    ]),
                            ]),
                        ],
                    }).then(async msg => {
                        let InputMethod =
                            (await msg.channel
                                .awaitMessageComponent({
                                    filter: i => i.user.id === user.id,
                                    time: 120_000,
                                    max: 1,
                                    errors: ["time"],
                                })
                                .then(i => {
                                    i.deferUpdate().catch(() => {});
                                    return i.values[0];
                                })
                                .catch(() => {})) || false;
                        if (!InputMethod) {
                            client.epicgamesDB.set(user.id, "others", "InputMethod");
                            user.send("Método de entrada predeterminado establecido por falta de reacción en menos de 2 minutos");
                        } else {
                            client.epicgamesDB.set(user.id, InputMethod, "InputMethod");
                        }
                        user.send("✋ **¡Cuenta vinculada correctamente!**").catch(() => {});
                        let logChannel =
                            guild.channels.cache.get(guilddata.logChannel) ||
                            (await guild.channels.fetch(guilddata.logChannel).catch(() => {})) ||
                            false;
                        if (guilddata.logChannel && guilddata.logChannel.length > 5 && logChannel && logChannel.id) {
                            logChannel
                                .send({
                                    embeds: [
                                        new Discord.EmbedBuilder()
                                            .setColor("#57F287")
                                            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
                                            .setTitle(`¡Vinculó/Actualizó su cuenta de EPIC GAMES!`)
                                            .addFields({ name: "**Nombre de Epic Games:**", value: `\`\`\`${Username}\`\`\`` })
                                            .addFields({ name: "**Plataforma:**", value: `\`\`\`${Platform}\`\`\`` })
                                            .addFields({ name: "**Método de entrada:**", value: `\`\`\`${InputMethod}\`\`\`` })
                                            .setFooter(client.getFooter("ID: " + user.id, user.displayAvatarURL())
                                            ),
                                    ],
                                })
                                .catch(() => {});
                        }
                    });
                })
                .catch(e => {
                    console.log(e);
                    interaction.reply({
                        content: "❌ **No puedo enviarte MD... ¡Primero habilita tus mensajes directos!**",
                        ephemeral: true,
                    });
                });
        }
    });
};
