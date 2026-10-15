const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const fs = require("fs");
const { allEmojis } = require("../../botconfig/emojiFunctions");
var { databasing, isValidURL } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "setup-owner",
    category: "Owner",
    aliases: ["setup-owners", "setupowner", "setupowners"],
    cooldown: 5,
    type: "info",
    usage: "setup-owner  -->  Follow the Steps",
    description: "Change the Bot Owners",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        if (!config.ownerIDS.some(r => r.includes(message.author.id)))
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-owner"]["variable1"]), 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-owner"]["variable2"]), 4096)),
                ],
            });
        try {
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: `Add Owner`,
                        description: `Add another Propietario to the Bot!`,
                        emoji: obeyUi.component(allEmojis.react.SUCCESS),
                    },
                    {
                        value: `Remove Owner`,
                        description: `Remove an Propietario from the Bot! (Only Original Propietario is allowed to do so)`,
                        emoji: obeyUi.component(allEmojis.react.ERROR),
                    },
                    {
                        value: "Settings",
                        description: `Show the current Ajustes`,
                        emoji: obeyUi.component(allEmojis.msg.list),
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Advertisement Configuración!`,
                        emoji: obeyUi.component(allEmojis.msg.cancel),
                    },
                ];
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder(obeyUi.plain("Click me to setup the Owners!"))
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
                let MenuEmbed = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setAuthor(obeyMeta.asAuthor({ name: "Owner Setup", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/prohibited_1f6ab?.png", url: "https://github.com/melodiabl" }))
                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-advertise"]["variable4"]), 4096));
                let used1 = false;
                //send the menu msg
                let menumsg = await message.channel.send({
                    embeds: [MenuEmbed],
                    components: [new ActionRowBuilder().addComponents([Selection])],
                });
                //function to handle the menuselection
                function menuselection(menu) {
                    let menuoptiondata = menuoptions.find(v => v.value == menu?.values[0]);
                    let menuoptionindex = menuoptions.findIndex(v => v.value == menu?.values[0]);
                    if (menu?.values[0] == "Cancel")
                        return menu?.reply(eval(client.la[ls]["cmds"]["owner"]["setup-advertise"]["variable5"]));
                    menu?.deferUpdate();
                    used1 = true;
                    handle_the_picks(menuoptionindex, menuoptiondata);
                }
                //Event
                client.on("interactionCreate", menu => {
    if (!menu?.isStringSelectMenu() && !menu?.isButton()) return;

                    if (menu?.message.id === menumsg.id) {
                        if (menu?.user.id === cmduser.id) {
                            if (used1)
                                return menu?.reply({
                                    content: `${obeyUi.markup("icon.error")} You already selected something, this Selection is now disabled!`,
                                    ephermal: true,
                                });
                            menuselection(menu);
                        } else
                            menu?.reply({
                                content: `${obeyUi.markup("icon.error")} You are not allowed to do that! Only: <@${cmduser.id}>`,
                                ephermal: true,
                            });
                    }
                });
            }

            const d2p = bool => (bool ? obeyUi.owned("`✔️ Enabled`") : obeyUi.owned("`❌ Disabled`"));
            const d2p2 = bool => (bool ? obeyUi.owned("`✔️ Yes`") : obeyUi.owned("`❌ Nope`"));

            async function handle_the_picks(menuoptionindex, menuoptiondata) {
                switch (menuoptionindex) {
                    //add
                    case 0:
                        {
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-owner"]["variable7"]), 256))
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-owner"]["variable8"]), 4096))
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
                                    var user = message.mentions.users.first();
                                    if (user) {
                                        if (config.ownerIDS.includes(user.id))
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-owner"]["variable9"]), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        try {
                                            let status = config;
                                            status.ownerIDS.push(user.id);
                                            fs.writeFile(`./botconfig/config.json`, JSON.stringify(status, null, 3), e => {
                                                if (e) {
                                                    console.log(e.stack ? String(e.stack).dim : String(e).dim);
                                                    return message.channel.send({
                                                        embeds: [
                                                            new EmbedBuilder()
                                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                .setColor(es.wrongcolor)
                                                                .setTitle(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["cmds"]["owner"]["setup-owner"][
                                                                            "variable10"
                                                                        ]
                                                                    ), 256)
                                                                )
                                                                .setDescription(
                                                                    obeyUi.limit(eval(
                                                                        client.la[ls]["cmds"]["owner"]["setup-owner"][
                                                                            "variable11"
                                                                        ]
                                                                    ), 4096)
                                                                ),
                                                        ],
                                                    });
                                                }
                                                return message.channel.send({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                            .setColor(es.color)
                                                            .setTitle(
                                                                obeyUi.limit(eval(
                                                                    client.la[ls]["cmds"]["owner"]["setup-owner"][
                                                                        "variable12"
                                                                    ]
                                                                ), 256)
                                                            ),
                                                    ],
                                                });
                                            });
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-owner"]["variable13"]), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-owner"]["variable14"]), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        throw "you didn't ping a valid User";
                                    }
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-owner"]["variable15"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`Cancelado the Operation!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    //remove
                    case 1:
                        {
                            if (config.ownerIDS[0] != message.author.id && config.ownerIDS[1] != message.author.id) {
                                return message.channel.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                            .setColor(es.wrongcolor)
                                            .setTitle(obeyUi.limit(`You are not allowed to remove Owners`, 256))
                                            .setDescription(
                                                obeyUi.limit(`Only <@${config.ownerIDS[0]}> and <@${config.ownerIDS[1]}> are allowed to do that!`, 4096)
                                            ),
                                    ],
                                });
                            }
                            var tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit("Remove Propietario", 256))
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setDescription(obeyUi.limit("Por favor Ping the Propietario you want to remove", 4096))
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
                                    var user = message.mentions.users.first();
                                    if (user) {
                                        if (!config.ownerIDS.includes(user.id))
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(obeyUi.limit("This Usuario isn't a Bot Propietario..", 256))
                                                        .setColor(es.wrongcolor)
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        if (user.id == "1087034447825735741") {
                                            return message.channel.send({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                        .setColor(es.wrongcolor)
                                                        .setTitle(obeyUi.limit(`You can't remove Tomato!`, 256))
                                                        .setDescription(obeyUi.limit(`This is a security Option`, 4096)),
                                                ],
                                            });
                                        }
                                        if (user.id == cmduser.id) {
                                            return message.channel.send({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                        .setColor(es.wrongcolor)
                                                        .setTitle(obeyUi.limit(`You can't remove yourself!`, 256)),
                                                ],
                                            });
                                        }
                                        try {
                                            let status = config;
                                            let index = status.ownerIDS.indexOf(user.id);
                                            if (index > -1) {
                                                status.ownerIDS.splice(index, 1);
                                                fs.writeFile(
                                                    `./botconfig/config.json`,
                                                    JSON.stringify(status, null, 3),
                                                    e => {
                                                        if (e) {
                                                            console.log(e.stack ? String(e.stack).dim : String(e).dim);
                                                            return message.channel.send({
                                                                embeds: [
                                                                    new EmbedBuilder()
                                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                        .setColor(es.wrongcolor)
                                                                        .setTitle(
                                                                            obeyUi.limit(eval(
                                                                                client.la[ls]["cmds"]["owner"][
                                                                                    "setup-owner"
                                                                                ]["variable10"]
                                                                            ), 256)
                                                                        )
                                                                        .setDescription(
                                                                            obeyUi.limit(eval(
                                                                                client.la[ls]["cmds"]["owner"][
                                                                                    "setup-owner"
                                                                                ]["variable11"]
                                                                            ), 4096)
                                                                        ),
                                                                ],
                                                            });
                                                        }
                                                        return message.channel.send({
                                                            embeds: [
                                                                new EmbedBuilder()
                                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                                    .setColor(es.color)
                                                                    .setTitle(
                                                                        obeyUi.limit(`Successfully removed ${user.username} from the Ownerlist!`, 256)
                                                                    ),
                                                            ],
                                                        });
                                                    }
                                                );
                                            } else {
                                                return message.channel.send({
                                                    embeds: [
                                                        new EmbedBuilder()
                                                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                            .setColor(es.wrongcolor)
                                                            .setTitle(obeyUi.limit(`Could not find the Usuario`, 256)),
                                                    ],
                                                });
                                            }
                                        } catch (e) {
                                            return message.reply({
                                                embeds: [
                                                    new Discord.EmbedBuilder()
                                                        .setTitle(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-owner"]["variable13"]), 256)
                                                        )
                                                        .setColor(es.wrongcolor)
                                                        .setDescription(
                                                            obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-owner"]["variable14"]), 4096)
                                                        )
                                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                                ],
                                            });
                                        }
                                    } else {
                                        throw "you didn't ping a valid User";
                                    }
                                })
                                .catch(e => {
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-owner"]["variable15"]), 256))
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`Cancelado the Operation!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        }
                        break;
                    //settings
                    case 2:
                        {
                            let originalOwner = config.ownerIDS.length > 1 ? config.ownerIDS[1] : config.ownerIDS[0];
                            var embed = new EmbedBuilder()
                                .setTitle(obeyUi.limit(`There are ${config.ownerIDS.length} Owners`, 256))
                                .setColor(es.color)
                                .setThumbnail(
                                    es.thumb
                                        ? es.footericon &&
                                          (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                            ? es.footericon
                                            : client.user.displayAvatarURL()
                                        : null
                                )
                                .addFields({ name: `__Original Owner__:`, value: `<@${originalOwner}>`.substring(0, 1024) })
                                .addFields({ name: `__Other Owner${config.ownerIDS.filter(id => id != originalOwner).length > 1 ? "s" : ""}__:`, value: `${config.ownerIDS
                                        .filter(id => id != originalOwner)
                                        .map(id => `<@${id}>`)
                                        .join("︲")}`.substring(0, 1024) })
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)));
                            return message.reply({ embeds: [embed] });
                        }
                        break;
                }
            }
        } catch (e) {
            console.log(String(e.stack).dim.bgRed);
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-owner"]["variable18"]), 4096)),
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
