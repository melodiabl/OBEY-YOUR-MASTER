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
    name: "setup",
    category: "Setup",
    aliases: [""],
    cooldown: 5,
    usage: "setup --> Sigue los Pasos",
    description: "Muestra todos los comandos de configuración",
    memberpermissions: ['Administrador'],
    type: "info",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: "setup-admin",
                        description: `Configuración Roles/Users for all/specific Admin Cmds`,
                        emoji: obeyUi.component("🔨"),
                    },
                    {
                        value: "setup-admincmdlog",
                        description: `Configuración a Logger for Admin Commands to a Canal`,
                        emoji: obeyUi.component("📑"),
                    },
                    {
                        value: "setup-aichat",
                        description: `Configuración a fun AI-Chat System to chat with me`,
                        emoji: obeyUi.component("💬"),
                    },
                    {
                        value: "setup-anticaps",
                        description: `Configuración a Anit-CAPS System to prevent CAPS-only msgs`,
                        emoji: obeyUi.component("🅰️"),
                    },
                    {
                        value: "setup-antidiscord",
                        description: `Configuración a Anit-DISCORD System to prevent DC-LINKS`,
                        emoji: obeyUi.component(allEmojis.msg.discord_robot),
                    },
                    {
                        value: "setup-antilink",
                        description: `Configuración a Anit-LINK System to prevent LINKS`,
                        emoji: obeyUi.component("🔗"),
                    },
                    {
                        value: "setup-antinuke",
                        description: `Configuración a Anit-NUKE System to prevent NUKES`,
                        emoji: obeyUi.component(allEmojis.msg.builder),
                    },
                    {
                        value: "setup-apply",
                        description: `Configuración up to 25 different Apply Systems`,
                        emoji: obeyUi.component("📋"),
                    },
                    {
                        value: "setup-autodelete",
                        description: `Configuración auto deletion Channels`,
                        emoji: obeyUi.component("🗑️"),
                    },
                    {
                        value: "setup-autoembed",
                        description: `Define Canal(s) to replace messages with EMBEDS`,
                        emoji: obeyUi.component("📰"),
                    },
                    {
                        value: "setup-automeme",
                        description: `Define a Canal to post MEMES every Minute`,
                        emoji: obeyUi.component(allEmojis.msg.automeme),
                    },
                    {
                        value: "setup-blacklist",
                        description: `Manage the Word(s)-Blacklist`,
                        emoji: obeyUi.component("🔠"),
                    },
                    {
                        value: "setup-commands",
                        description: `Enable/Disable specific Commands`,
                        emoji: obeyUi.component("⚙️"),
                    },
                    {
                        value: "setup-counter",
                        description: `Configuración a fun Number-Counter Canal`,
                        emoji: obeyUi.component("#️⃣"),
                    },
                    {
                        value: "setup-customcommand",
                        description: `Configuración up to 25 different Personalizado-Commands`,
                        emoji: obeyUi.component("⌨️"),
                    },
                    {
                        value: "setup-dailyfact",
                        description: `Configuración a Canal to post daily Facts`,
                        emoji: obeyUi.component("🗓"),
                    },
                    {
                        value: "setup-embed",
                        description: `Configuración the Look of the Embeded Messages`,
                        emoji: obeyUi.component("📕"),
                    },
                    {
                        value: "setup-jtc",
                        description: `Configuración the Join-To-Create Canal(s)`,
                        emoji: obeyUi.component("🔈"),
                    },
                    {
                        value: "setup-keyword",
                        description: `Configuración up to 25 different Keyword-Messages`,
                        emoji: obeyUi.component("📖"),
                    },
                    {
                        value: "setup-language",
                        description: `Manage the Bot's Language`,
                        emoji: obeyUi.component("🇬🇧"),
                    },
                    {
                        value: "setup-leave",
                        description: `Manage the Leave Messages`,
                        emoji: obeyUi.component("📤"),
                    },
                    {
                        value: "setup-logger",
                        description: `Configuración the Audit-Log`,
                        emoji: obeyUi.component("🛠"),
                    },
                    {
                        value: "setup-membercount",
                        description: `Configuración up to 25 different Miembro-Counters`,
                        emoji: obeyUi.component("📈"),
                    },
                    {
                        value: "setup-radio",
                        description: `Configuración the Radio/Waitingroom System`,
                        emoji: obeyUi.component("📻"),
                    },
                    {
                        value: "setup-rank",
                        description: `Configuración the Ranking System`,
                        emoji: obeyUi.component("📊"),
                    },
                    {
                        value: "setup-reactionrole",
                        description: `Configuración Infinite Reaction Roles`,
                        emoji: obeyUi.component("📌"),
                    },
                    {
                        value: "setup-reportlog",
                        description: `Configuración the Report System & Canal`,
                        emoji: obeyUi.component("🗃"),
                    },
                    {
                        value: "setup-roster",
                        description: `Configuración the Roster System`,
                        emoji: obeyUi.component("📜"),
                    },
                    {
                        value: "setup-serverstats",
                        description: `Configuración up to 25 different Miembro-Counters`,
                        emoji: obeyUi.component("📈"),
                    },
                    {
                        value: "setup-suggestion",
                        description: `Configuración the Sugerencia System`,
                        emoji: obeyUi.component("💡"),
                    },
                    {
                        value: "setup-ticket",
                        description: `Configuración up to 25 different Ticket-Systems`,
                        emoji: obeyUi.component("📨"),
                    },
                    {
                        value: "setup-tiktok",
                        description: `Configuración up to 3 different TikTok Logger Channels`,
                        emoji: obeyUi.component(allEmojis.msg.tiktok),
                    },
                    {
                        value: "setup-twitch",
                        description: `Configuración up to 5 different Twitch Logger Channels`,
                        emoji: obeyUi.component(allEmojis.msg.twitch),
                    },
                    {
                        value: "setup-twitter",
                        description: `Configuración up to 2 different Twitter Logger Channels`,
                        emoji: obeyUi.component(allEmojis.msg.spotify),
                    },
                    {
                        value: "setup-validcode",
                        description: `Configuración the Valid-Code System`,
                        emoji: obeyUi.component(allEmojis.msg.validcode),
                    },
                    {
                        value: "setup-warn",
                        description: `Configuración the Warn System Ajustes`,
                        emoji: obeyUi.component(allEmojis.msg.warn),
                    },
                    {
                        value: "setup-welcome",
                        description: `Configuración the Bienvenido System/Messages`,
                        emoji: obeyUi.component(allEmojis.msg.channel),
                    },
                    {
                        value: "setup-youtube",
                        description: `Configuración up to 5 different Youtube Logger Channels`,
                        emoji: obeyUi.component(allEmojis.msg.youtube),
                    },
                ];
                let Selection1 = new StringSelectMenuBuilder()
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the (1/3) Systems [A-C]!"))
                    .setCustomId("MenuSelection")
                    .setMaxValues(1)
                    .setMinValues(1)
                    .addOptions(
                        menuoptions
                            .map((option, index) => {
                                if (index < Math.ceil(menuoptions.length / 3)) {
                                    let Obj = {
                                        label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                        value: option.value.substring(0, 50),
                                        description: option.description.substring(0, 50),
                                    };
                                    if (option.emoji) Obj.emoji = option.emoji;
                                    return Obj;
                                }
                            })
                            .filter(Boolean)
                    );
                let Selection2 = new StringSelectMenuBuilder()
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the (2/3) Systems [C-R]!"))
                    .setCustomId("MenuSelection")
                    .setMaxValues(1)
                    .setMinValues(1)
                    .addOptions(
                        menuoptions
                            .map((option, index) => {
                                if (
                                    index >= Math.ceil(menuoptions.length / 3) &&
                                    index < 2 * Math.ceil(menuoptions.length / 3)
                                ) {
                                    let Obj = {
                                        label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                        value: option.value.substring(0, 50),
                                        description: option.description.substring(0, 50),
                                    };
                                    if (option.emoji) Obj.emoji = option.emoji;
                                    return Obj;
                                }
                            })
                            .filter(Boolean)
                    );
                let Selection3 = new StringSelectMenuBuilder()
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the (3/3) Systems [R-Z]!"))
                    .setCustomId("MenuSelection")
                    .setMaxValues(1)
                    .setMinValues(1)
                    .addOptions(
                        menuoptions
                            .map((option, index) => {
                                if (index >= 2 * Math.ceil(menuoptions.length / 3)) {
                                    let Obj = {
                                        label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                        value: option.value.substring(0, 50),
                                        description: option.description.substring(0, 50),
                                    };
                                    if (option.emoji) Obj.emoji = option.emoji;
                                    return Obj;
                                }
                            })
                            .filter(Boolean)
                    );
                //define the embed
                let MenuEmbed1 = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setAuthor(obeyMeta.asAuthor({ name: "Setup-Systems | (1/3) [A-C]", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/lg/57/gear_2699.png", url: "https://github.com/melodiabl" }))
                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup"]["variable1"]), 4096));
                let MenuEmbed2 = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setAuthor(obeyMeta.asAuthor({ name: "Setup-Systems | (2/3) [C-R]", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/lg/57/gear_2699.png", url: "https://github.com/melodiabl" }))
                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup"]["variable2"]), 4096));
                let MenuEmbed3 = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setAuthor(obeyMeta.asAuthor({ name: "Setup-Systems | (3/3) [R-Z]", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/lg/57/gear_2699.png", url: "https://github.com/melodiabl" }))
                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup"]["variable3"]), 4096));
                //send the menu msg
                let menumsg1 = await message.reply({
                    embeds: [MenuEmbed1],
                    components: [new ActionRowBuilder().addComponents(Selection1)],
                });
                let menumsg2 = await message.reply({
                    embeds: [MenuEmbed2],
                    components: [new ActionRowBuilder().addComponents(Selection2)],
                });
                let menumsg3 = await message.reply({
                    embeds: [MenuEmbed3],
                    components: [new ActionRowBuilder().addComponents(Selection3)],
                });
                //function to handle the menuselection
                function menuselection(menu) {
                    let menuoptiondata = menuoptions.find(v => v.value == menu?.values[0]);
                    let menuoptionindex = menuoptions.findIndex(v => v.value == menu?.values[0]);
                    menu?.deferUpdate();
                    handle_the_picks(menuoptionindex, menuoptiondata);
                }
                //Event
                client.on("interactionCreate", menu => {
                    if (!menu?.isStringSelectMenu() && !menu?.isButton()) return;
                    if (menu?.message.id === menumsg1.id) {
                        if (menu?.user.id === cmduser.id) {
                            menumsg1.edit({ components: [], embeds: menumsg1.embeds }).catch(() => {});
                            menuselection(menu);
                        } else
                            menu?.reply({
                                content: `${obeyUi.markup("icon.error")} ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                                ephemeral: true,
                            });
                    }
                    if (menu?.message.id === menumsg2.id) {
                        if (menu?.user.id === cmduser.id) {
                            menumsg2.edit({ components: [], embeds: menumsg2.embeds }).catch(() => {});
                            menuselection(menu);
                        } else
                            menu?.reply({
                                content: `${obeyUi.markup("icon.error")} ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                                ephemeral: true,
                            });
                    }
                    if (menu?.message.id === menumsg3.id) {
                        if (menu?.user.id === cmduser.id) {
                            menumsg3.edit({ components: [], embeds: menumsg3.embeds }).catch(() => {});
                            menuselection(menu);
                        } else
                            menu?.reply({
                                content: `${obeyUi.markup("icon.error")} ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                                ephemeral: true,
                            });
                    }
                });
            }

            async function handle_the_picks(menuoptionindex, menuoptiondata) {
                require(`./${menuoptiondata.value.toLowerCase()}`).run(client, message, args, cmduser, text, prefix);
            }
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup"]["variable10"]), 4096)),
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
