const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-admin",
    category: "Setup",
    aliases: ["setupadmin", "setup-mod", "setupmod", "admin-setup", "adminsetup"],
    cooldown: 5,
    usage: "setup-admin  --> Sigue los Pasos",
    description: "Permite que Roles/Usuarios específicos ejecuten Comandos específicos / todos los Comandos!",
    memberpermissions: ['Administrador'],
    type: "info",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        let timeouterror;
        try {
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "Add Role",
                        description: `Agregar Roles a los Roles de Administrador generales`,
                        emoji: obeyUi.component("🔧"),
                    },
                    {
                        value: "Remove Role",
                        description: `Remove Roles from the general Admin Roles`,
                        emoji: obeyUi.component("🗑"),
                    },
                    {
                        value: "Show Settings",
                        description: `Show Ajustes of all Admin Roles`,
                        emoji: obeyUi.component(allEmojis.msg.list),
                    },
                    {
                        value: "Per Command Roles",
                        description: `Manage Admin Roles of each Comando`,
                        emoji: obeyUi.component("⚙️"),
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Admin-Configuración!`,
                        emoji: obeyUi.component(allEmojis.msg.cancel),
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Administration Roles"))
                    .addOptions(
                        menuoptions.map(option => {
                            let Obj = {
                                label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                value: option.value.substring(0, 50),
                                description: option.description.substring(0, 50),
                            };
                            if (option.emoji) Obj.emoji = option.emoji;
                            return Obj;
                        })
                    );

                //define the embed
                let MenuEmbed = new EmbedBuilder()
                    .setColor(es.color)
                    .setAuthor(obeyMeta.asAuthor({ name: "Admin Setup", iconURL: obeyUi.image("icon.shield"), url: "https://github.com/melodiabl" }))
                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable2"]), 4096));
                //send the menu msg
                let menumsg = await message.reply({
                    embeds: [MenuEmbed],
                    components: [new ActionRowBuilder().addComponents(Selection)],
                });
                //Create the collector
                const collector = menumsg.createMessageComponentCollector({
                    filter: i => i?.isStringSelectMenu() && i?.message.author.id == client.user.id && i?.user,
                    time: 90000,
                });
                //Menu Collections
                collector.on("collect", menu => {
                    if (menu?.user.id === cmduser.id) {
                        collector.stop();
                        let menuoptiondata = menuoptions.find(v => v.value == menu?.values[0]);
                        if (menu?.values[0] == "Cancel")
                            return menu?.reply(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"]));
                        menu?.deferUpdate();
                        let SetupNumber = menu?.values[0].split(" ")[0];
                        handle_the_picks(menu?.values[0], SetupNumber, menuoptiondata);
                    } else
                        menu?.reply({
                            content: `${obeyUi.markup("icon.error")} ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                            ephemeral: true,
                        });
                });
                //Once the Collections ended edit the menu message
                collector.on("end", collected => {
                    menumsg.edit({
                        embeds: [EmbedBuilder.from(menumsg.embeds[0]).setDescription(obeyUi.limit(`~~${menumsg.embeds[0].description}~~`, 4096))],
                        components: [],
                        content: `${collected && collected.first() && collected.first().values ? `${allEmojis.msg.SUCCESS} **Selected: \`${collected ? collected.first().values[0] : "Nothing"}\`**` : obeyUi.owned("❌ **NOTHING SELECTED - CANCELLED**")}`,
                    });
                });
            }

            async function handle_the_picks(optionhandletype, SetupNumber, menuoptiondata) {
                switch (optionhandletype) {
                    case "Add Role":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable35"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable36"]), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                            await tempmsg.channel
                                .awaitMessages({
                                    filter: m => m.author.id === message.author.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(collected => {
                                    var message = collected.first();
                                    var role = message.mentions.roles
                                        .filter(role => role.guild.id == message.guild.id)
                                        .first();
                                    if (role) {
                                        var adminroles = client.settings.get(message.guild.id, "adminroles");
                                        if (adminroles.includes(role.id))
                                            return message.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable37"]), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        try {
                                            client.settings.push(message.guild.id, role.id, "adminroles");
                                            return message.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable38"]), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`Everyone with one of those Roles:\n<@&${client.settings.get(message.guild.id, "adminroles").join(">\n<@&")}>\nis now able to use the Admin Commands`.substring(
                                                                0,
                                                                2048
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable39"]), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable47"]), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        return message.reply("¡no mencionaste un Rol válido!");
                                    }
                                })
                                .catch(e => {
                                    timeouterror = e;
                                });
                            if (timeouterror)
                                return message.reply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable41"]), 256))
                                            .setColor(es.wrongcolor)
                                            .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                    ],
                                });
                        }
                        break;
                    case "Remove Role":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable42"]), 256))
                                        .setColor(es.color)
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable43"]), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                            await tempmsg.channel
                                .awaitMessages({
                                    filter: m => m.author.id === message.author.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(collected => {
                                    var message = collected.first();
                                    var role = message.mentions.roles
                                        .filter(role => role.guild.id == message.guild.id)
                                        .first();
                                    if (role) {
                                        var adminroles = client.settings.get(message.guild.id, "adminroles");
                                        if (!adminroles.includes(role.id))
                                            return message.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable44"]), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        try {
                                            client.settings.remove(message.guild.id, role.id, "adminroles");
                                            return message.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable45"]), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`Everyone with one of those Roles:\n<@&${client.settings.get(message.guild.id, "adminroles").join(">\n<@&")}>\nis now able to use the Admin Commands`.substring(
                                                                0,
                                                                2048
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable46"]), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable52"]), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        return message.reply("¡no mencionaste un Rol válido!");
                                    }
                                })
                                .catch(e => {
                                    timeouterror = e;
                                });
                            if (timeouterror)
                                return message.reply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable48"]), 256))
                                            .setColor(es.wrongcolor)
                                            .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                    ],
                                });
                        }
                        break;
                    case "Show Settings":
                        {
                            let db = client.settings.get(message.guild.id, "cmdadminroles");
                            var cmdrole = [];
                            for (const [cmd, values] of Object.entries(db)) {
                                var percmd = [];
                                if (values.length > 0) {
                                    for (const r of values) {
                                        if (message.guild.roles.cache.get(r)) {
                                            percmd.push(`<@&${r}>`);
                                        } else if (message.guild.members.cache.get(r)) {
                                            percmd.push(`<@${r}>`);
                                        } else {
                                            client.settings.remove(message.guild.id, r, `cmdadminroles.${cmd}`);
                                        }
                                    }
                                    var key = `For the \`${cmd}\` Command`;
                                    cmdrole.push({ info: percmd, name: key });
                                }
                            }
                            var embed = new EmbedBuilder()
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable50"]), 256))
                                .setColor(es.color)
                                .setDescription(
                                    obeyUi.limit(`**General Admin Roles:**\n${client.settings.get(message.guild.id, "adminroles").length > 0 ? `<@&${client.settings.get(message.guild.id, "adminroles").join(">, <@&")}>` : "No General Admin Roles Setup yet"}`.substring(
                                        0,
                                        2048
                                    ), 4096)
                                )
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)));
                            for (const cmd of cmdrole) {
                                embed.addFields({ name: cmd.name, value: cmd.info.join(", ") });
                            }
                            return message.reply({ embeds: [embed] });
                        }
                        break;
                    case "Per Command Roles":
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable4"]), 256))
                                        .setColor(es.color)
                                        .setDescription(
                                            obeyUi.limit(`
              ${client.commands
                  ?.filter?.(cmd => cmd.category?.includes?.("Admin"))
                  ?.map?.(cmd => `\`${cmd.name}\``)
                  .join(" | ")}


              *Enter one of those Commands!*`, 4096)
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                            var thecmd;
                            await tempmsg.channel
                                .awaitMessages({
                                    filter: m => m.author.id == message.author.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(async collected => {
                                    var com = collected.first().content.split(" ")[0];
                                    const cmd =
                                        client.commands.get(com.toLowerCase()) ||
                                        client.commands.get(client.aliases.get(com.toLowerCase()));
                                    if (!cmd)
                                        return message.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable5"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    if (!cmd.category.toLowerCase().includes("admin"))
                                        return message.reply({
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable6"]), 256)
                                                    )
                                                    .setColor(es.wrongcolor)
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    thecmd = cmd.name;
                                    if (["detailwarn", "warnings", "report"].includes(thecmd.toLowerCase()))
                                        return (timeouterror = {
                                            message: "YOU CANNOT USE THAT COMMAND, CAUSE IT DOES NOT NEED PERMISSIONS",
                                        });

                                    client.settings.ensure(message.guild.id, [], `cmdadminroles.${thecmd}`);

                                    if (["dm"].includes(thecmd.toLowerCase()))
                                        return (timeouterror = {
                                            message: "YOU CANNOT USE THAT COMMAND, CAUSE IT IS ADMINISTRATOR ONLY",
                                        });
                                    second_layer();
                                    async function second_layer() {
                                        let menuoptions = [
                                            {
                                                value: "Add Role",
                                                description:
                                                    `Add Rol/Usuario to ${thecmd.toUpperCase()} ADMIN ROLES`.substring(0, 50),
                                                emoji: obeyUi.component("🔧"),
                                            },
                                            {
                                                value: "Remove Role",
                                                description:
                                                    `Rempove Rol/Usuario from ${thecmd.toUpperCase()} ADMIN ROLES`.substring(
                                                        0,
                                                        50
                                                    ),
                                                emoji: obeyUi.component("🗑"),
                                            },
                                            {
                                                value: "Show Settings",
                                                description: `Show all Roles of ${thecmd.toUpperCase()} ADMIN ROLES`,
                                                emoji: obeyUi.component("📑"),
                                            },
                                            {
                                                value: "Cancel",
                                                description: `Cancelar and stop the Admin-Per-Comando-Configuración!`,
                                                emoji: obeyUi.component(allEmojis.msg.cancel),
                                            },
                                        ];
                                        //define the selection
                                        let Selection = new StringSelectMenuBuilder()
                                            .setCustomId("MenuSelection")
                                            .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                                            .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                                            .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Administration Roles"))
                                            .addOptions(
                                                menuoptions.map(option => {
                                                    let Obj = {
                                                        label: option.label
                                                            ? option.label.substring(0, 50)
                                                            : option.value.substring(0, 50),
                                                        value: option.value.substring(0, 50),
                                                        description: option.description.substring(0, 50),
                                                    };
                                                    if (option.emoji) Obj.emoji = option.emoji;
                                                    return Obj;
                                                })
                                            );

                                        //define the embed
                                        let MenuEmbed = new EmbedBuilder()
                                            .setColor(es.color)
                                            .setAuthor(obeyMeta.asAuthor({ name: "Admin Setup", iconURL: obeyUi.image("icon.shield"), url: "https://github.com/melodiabl" }))
                                            .setDescription(
                                                obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable2"]), 4096)
                                            );
                                        //send the menu msg
                                        let menumsg = await message.reply({
                                            embeds: [MenuEmbed],
                                            components: [new ActionRowBuilder().addComponents(Selection)],
                                        });
                                        //Create the collector
                                        const collector = menumsg.createMessageComponentCollector({
                                            filter: i =>
                                                i?.isStringSelectMenu() && i?.message.author.id == client.user.id && i?.user,
                                            time: 90000,
                                        });
                                        //Menu Collections
                                        collector.on("collect", menu => {
                                            if (menu?.user.id === cmduser.id) {
                                                collector.stop();
                                                let menuoptiondata = menuoptions.find(v => v.value == menu?.values[0]);
                                                if (menu?.values[0] == "Cancel")
                                                    return menu?.reply(
                                                        eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"])
                                                    );
                                                menu?.deferUpdate();
                                                let SetupNumber = menu?.values[0].split(" ")[0];
                                                handle_the_picks2(menu?.values[0], SetupNumber, menuoptiondata);
                                            } else
                                                menu?.reply({
                                                    content: `${obeyUi.markup("icon.error")} ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                                                    ephemeral: true,
                                                });
                                        });
                                        //Once the Collections ended edit the menu message
                                        collector.on("end", collected => {
                                            menumsg.edit({
                                                embeds: [
                                                    EmbedBuilder.from(menumsg.embeds[0]).setDescription(obeyUi.limit(`~~${menumsg.embeds[0].description}~~`, 4096)),
                                                ],
                                                components: [],
                                                content: `${collected && collected.first() && collected.first().values ? `${allEmojis.msg.SUCCESS} **Selected: \`${collected ? collected.first().values[0] : "Nothing"}\`**` : obeyUi.owned("❌ **NOTHING SELECTED - CANCELLED**")}`,
                                            });
                                        });
                                    }
                                    async function handle_the_picks2(optionhandletype, SetupNumber, menuoptiondata) {
                                        switch (optionhandletype) {
                                            case "Add Role":
                                                {
                                                    var tempmsg = await message.reply({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setTitle(obeyUi.limit("Which Rol/Usuario do you wanna add to " + thecmd, 256))
                                                                .setColor(es.color)
                                                                .setDescription(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-admin"][
                                                                            "variable11"
                                                                        ]
                                                                    ), 4096)
                                                                )
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                        ],
                                                    });
                                                    await tempmsg.channel
                                                        .awaitMessages({
                                                            filter: m => m.author.id === message.author.id,
                                                            max: 1,
                                                            time: 90000,
                                                            errors: ["time"],
                                                        })
                                                        .then(collected => {
                                                            var message = collected.first();
                                                            var role = message.mentions.roles
                                                                .filter(role => role.guild.id == message.guild.id)
                                                                .first();
                                                            var user = message.mentions.users.first();
                                                            if (role) {
                                                                var adminroles = client.settings.get(
                                                                    message.guild.id,
                                                                    `cmdadminroles.${thecmd}`
                                                                );
                                                                if (adminroles.includes(role.id))
                                                                    return message.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setTitle(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable12"]
                                                                                    ), 256)
                                                                                )
                                                                                .setColor(es.wrongcolor)
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                        ],
                                                                    });
                                                                try {
                                                                    client.settings.push(
                                                                        message.guild.id,
                                                                        role.id,
                                                                        `cmdadminroles.${thecmd}`
                                                                    );
                                                                    let cmd = client.settings.get(
                                                                        message.guild.id,
                                                                        `cmdadminroles.${thecmd}`
                                                                    );
                                                                    var cmdrole = [];
                                                                    if (cmd.length > 0) {
                                                                        for (const r of cmd) {
                                                                            if (message.guild.roles.cache.get(r)) {
                                                                                cmdrole.push(`<@&${r}>`);
                                                                            } else if (message.guild.members.cache.get(r)) {
                                                                                cmdrole.push(`<@${r}>`);
                                                                            } else {
                                                                                //console.log(r)
                                                                                client.settings.remove(
                                                                                    message.guild.id,
                                                                                    r,
                                                                                    `cmdadminroles.${cmd}`
                                                                                );
                                                                            }
                                                                        }
                                                                    }
                                                                    return message.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setTitle(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable13"]
                                                                                    ), 256)
                                                                                )
                                                                                .setColor(es.color)
                                                                                .setDescription(
                                                                                    obeyUi.limit(`Everyone with one of those Roles/Users:\n${cmdrole.join("\n")}\nis now able to use the ${thecmd} Admin Commands`.substring(
                                                                                        0,
                                                                                        2048
                                                                                    ), 4096)
                                                                                )
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                        ],
                                                                    });
                                                                } catch (e) {
                                                                    return message.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setTitle(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable14"]
                                                                                    ), 256)
                                                                                )
                                                                                .setColor(es.wrongcolor)
                                                                                .setDescription(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable19"]
                                                                                    ), 4096)
                                                                                )
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                        ],
                                                                    });
                                                                }
                                                            } else if (user) {
                                                                var adminroles = client.settings.get(
                                                                    message.guild.id,
                                                                    `cmdadminroles.${thecmd}`
                                                                );
                                                                if (adminroles.includes(user.id))
                                                                    return message.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setTitle(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable16"]
                                                                                    ), 256)
                                                                                )
                                                                                .setColor(es.wrongcolor)
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                        ],
                                                                    });
                                                                try {
                                                                    client.settings.push(
                                                                        message.guild.id,
                                                                        user.id,
                                                                        `cmdadminroles.${thecmd}`
                                                                    );
                                                                    let cmd = client.settings.get(
                                                                        message.guild.id,
                                                                        `cmdadminroles.${thecmd}`
                                                                    );
                                                                    var cmdrole = [];
                                                                    if (cmd.length > 0) {
                                                                        for (const r of cmd) {
                                                                            if (message.guild.roles.cache.get(r)) {
                                                                                cmdrole.push(`<@&${r}>`);
                                                                            } else if (message.guild.members.cache.get(r)) {
                                                                                cmdrole.push(`<@${r}>`);
                                                                            } else {
                                                                                //console.log(r)
                                                                                client.settings.remove(
                                                                                    message.guild.id,
                                                                                    r,
                                                                                    `cmdadminroles.${cmd}`
                                                                                );
                                                                            }
                                                                        }
                                                                    }
                                                                    return message.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setTitle(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable17"]
                                                                                    ), 256)
                                                                                )
                                                                                .setColor(es.color)
                                                                                .setDescription(
                                                                                    obeyUi.limit(`Everyone with one of those Roles/Users:\n${cmdrole.join("\n")}\nis now able to use the ${thecmd} Admin Commands`.substring(
                                                                                        0,
                                                                                        2048
                                                                                    ), 4096)
                                                                                )
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                        ],
                                                                    });
                                                                } catch (e) {
                                                                    return message.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setTitle(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable18"]
                                                                                    ), 256)
                                                                                )
                                                                                .setColor(es.wrongcolor)
                                                                                .setDescription(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable25"]
                                                                                    ), 4096)
                                                                                )
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                        ],
                                                                    });
                                                                }
                                                            } else {
                                                                return message.reply("¡no mencionaste un Rol válido!");
                                                            }
                                                        })
                                                        .catch(e => {
                                                            timeouterror = e;
                                                        });
                                                    if (timeouterror)
                                                        return message.reply({
                                                            embeds: [
                                                                new EmbedBuilder()
                                                                    .setTitle(
                                                                        obeyUi.limit(eval(
                                                                            client.la[ls]["cmds"]["setup"]["setup-admin"][
                                                                                "variable20"
                                                                            ]
                                                                        ), 256)
                                                                    )
                                                                    .setColor(es.wrongcolor)
                                                                    .setDescription(
                                                                        obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096)
                                                                    )
                                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                            ],
                                                        });
                                                }
                                                break;
                                            case "Remove Role":
                                                {
                                                    var tempmsg = await message.reply({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setTitle(
                                                                    obeyUi.limit("Which Rol/Usuario do you wanna remove from " + thecmd, 256)
                                                                )
                                                                .setColor(es.color)
                                                                .setDescription(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["cmds"]["setup"]["setup-admin"][
                                                                            "variable21"
                                                                        ]
                                                                    ), 4096)
                                                                )
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                        ],
                                                    });
                                                    await tempmsg.channel
                                                        .awaitMessages({
                                                            filter: m => m.author.id === message.author.id,
                                                            max: 1,
                                                            time: 90000,
                                                            errors: ["time"],
                                                        })
                                                        .then(collected => {
                                                            var message = collected.first();
                                                            var role = message.mentions.roles
                                                                .filter(role => role.guild.id == message.guild.id)
                                                                .first();
                                                            var user = message.mentions.users.first();
                                                            if (role) {
                                                                var adminroles = client.settings.get(
                                                                    message.guild.id,
                                                                    `cmdadminroles.${thecmd}`
                                                                );
                                                                if (!adminroles.includes(role.id))
                                                                    return message.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setTitle(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable22"]
                                                                                    ), 256)
                                                                                )
                                                                                .setColor(es.wrongcolor)
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                        ],
                                                                    });
                                                                try {
                                                                    client.settings.remove(
                                                                        message.guild.id,
                                                                        role.id,
                                                                        `cmdadminroles.${thecmd}`
                                                                    );
                                                                    let cmd = client.settings.get(
                                                                        message.guild.id,
                                                                        `cmdadminroles.${thecmd}`
                                                                    );
                                                                    var cmdrole = [];
                                                                    if (cmd.length > 0) {
                                                                        for (const r of cmd) {
                                                                            if (message.guild.roles.cache.get(r)) {
                                                                                cmdrole.push(`<@&${r}>`);
                                                                            } else if (message.guild.members.cache.get(r)) {
                                                                                cmdrole.push(`<@${r}>`);
                                                                            } else {
                                                                                //console.log(r)
                                                                                client.settings.remove(
                                                                                    message.guild.id,
                                                                                    r,
                                                                                    `cmdadminroles.${cmd}`
                                                                                );
                                                                            }
                                                                        }
                                                                    }
                                                                    return message.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setTitle(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable23"]
                                                                                    ), 256)
                                                                                )
                                                                                .setColor(es.color)
                                                                                .setDescription(
                                                                                    obeyUi.limit(`Everyone with one of those Roles/Users:\n${cmdrole.join("\n")}\nis now able to use the ${thecmd} Admin Commands`.substring(
                                                                                        0,
                                                                                        2048
                                                                                    ), 4096)
                                                                                )
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                        ],
                                                                    });
                                                                } catch (e) {
                                                                    return message.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setTitle(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable24"]
                                                                                    ), 256)
                                                                                )
                                                                                .setColor(es.wrongcolor)
                                                                                .setDescription(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable29"]
                                                                                    ), 4096)
                                                                                )
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                        ],
                                                                    });
                                                                }
                                                            } else if (user) {
                                                                var adminroles = client.settings.get(
                                                                    message.guild.id,
                                                                    `cmdadminroles.${thecmd}`
                                                                );
                                                                if (!adminroles.includes(user.id))
                                                                    return message.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setTitle(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable26"]
                                                                                    ), 256)
                                                                                )
                                                                                .setColor(es.wrongcolor)
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                        ],
                                                                    });
                                                                try {
                                                                    client.settings.remove(
                                                                        message.guild.id,
                                                                        user.id,
                                                                        `cmdadminroles.${thecmd}`
                                                                    );
                                                                    let cmd = client.settings.get(
                                                                        message.guild.id,
                                                                        `cmdadminroles.${thecmd}`
                                                                    );
                                                                    var cmdrole = [];
                                                                    if (cmd.length > 0) {
                                                                        for (const r of cmd) {
                                                                            if (message.guild.roles.cache.get(r)) {
                                                                                cmdrole.push(`<@&${r}>`);
                                                                            } else if (message.guild.members.cache.get(r)) {
                                                                                cmdrole.push(`<@${r}>`);
                                                                            } else {
                                                                                //console.log(r)
                                                                                client.settings.remove(
                                                                                    message.guild.id,
                                                                                    r,
                                                                                    `cmdadminroles.${cmd}`
                                                                                );
                                                                            }
                                                                        }
                                                                    }
                                                                    return message.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setTitle(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable27"]
                                                                                    ), 256)
                                                                                )
                                                                                .setColor(es.color)
                                                                                .setDescription(
                                                                                    obeyUi.limit(`Everyone with one of those Roles/Users:\n${cmdrole.join("\n")}\nis now able to use the ${thecmd} Admin Commands`.substring(
                                                                                        0,
                                                                                        2048
                                                                                    ), 4096)
                                                                                )
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                        ],
                                                                    });
                                                                } catch (e) {
                                                                    return message.reply({
                                                                        embeds: [
                                                                            new EmbedBuilder()
                                                                                .setTitle(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable28"]
                                                                                    ), 256)
                                                                                )
                                                                                .setColor(es.wrongcolor)
                                                                                .setDescription(
                                                                                    obeyUi.limit(eval(
                                                                                        client.la[ls]["cmds"]["setup"][
                                                                                            "setup-admin"
                                                                                        ]["variable40"]
                                                                                    ), 4096)
                                                                                )
                                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                                        ],
                                                                    });
                                                                }
                                                            } else {
                                                                return message.reply("¡no mencionaste un Rol válido!");
                                                            }
                                                        })
                                                        .catch(e => {
                                                            timeouterror = e;
                                                        });
                                                    if (timeouterror)
                                                        return message.reply({
                                                            embeds: [
                                                                new EmbedBuilder()
                                                                    .setTitle(
                                                                        obeyUi.limit(eval(
                                                                            client.la[ls]["cmds"]["setup"]["setup-admin"][
                                                                                "variable30"
                                                                            ]
                                                                        ), 256)
                                                                    )
                                                                    .setColor(es.wrongcolor)
                                                                    .setDescription(
                                                                        obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096)
                                                                    )
                                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                            ],
                                                        });
                                                }
                                                break;
                                            case "Show Settings":
                                                {
                                                    let db = client.settings.get(message.guild.id, "cmdadminroles");
                                                    var cmdrole = [];
                                                    for (const [cmd, values] of Object.entries(db)) {
                                                        var percmd = [];
                                                        if (values.length > 0) {
                                                            for (const r of values) {
                                                                if (message.guild.roles.cache.get(r)) {
                                                                    percmd.push(`<@&${r}>`);
                                                                } else if (message.guild.members.cache.get(r)) {
                                                                    percmd.push(`<@${r}>`);
                                                                } else {
                                                                    client.settings.remove(
                                                                        message.guild.id,
                                                                        r,
                                                                        `cmdadminroles.${cmd}`
                                                                    );
                                                                }
                                                            }
                                                            var key = `For the \`${cmd}\` Command`;
                                                            cmdrole.push({ info: percmd, name: key });
                                                        }
                                                    }
                                                    var embed = new EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable33"]), 256)
                                                        )
                                                        .setColor(es.color)
                                                        .setDescription(
                                                            obeyUi.limit(`**General Admin Roles:**\n${client.settings.get(message.guild.id, "adminroles").length > 0 ? `<@&${client.settings.get(message.guild.id, "adminroles").join(">, <@&")}>` : "No General Admin Roles Setup yet"}`.substring(
                                                                0,
                                                                2048
                                                            ), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)));

                                                    for (const cmd of cmdrole) {
                                                        embed.addFields({ name: cmd.name, value: cmd.info.join(", ") });
                                                    }
                                                    return message.reply({ embeds: [embed] });
                                                }
                                                break;
                                        }
                                    }
                                })
                                .catch(e => {
                                    timeouterror = e;
                                });
                            if (timeouterror)
                                return message.reply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-admin"]["variable10"]), 256))
                                            .setColor(es.wrongcolor)
                                            .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                    ],
                                });
                        }
                        break;
                }
            }
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(`\`\`\`${String(JSON.stringify(e)).substring(0, 2000)}\`\`\``, 4096)),
                ],
            });
        }
    },
};
/**
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 */
