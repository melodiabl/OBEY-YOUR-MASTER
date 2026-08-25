var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup",
    category: "💪 Setup",
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
                        emoji: "🔨",
                    },
                    {
                        value: "setup-admincmdlog",
                        description: `Configuración a Logger for Admin Commands to a Canal`,
                        emoji: "📑",
                    },
                    {
                        value: "setup-aichat",
                        description: `Configuración a fun AI-Chat System to chat with me`,
                        emoji: "💬",
                    },
                    {
                        value: "setup-anticaps",
                        description: `Configuración a Anit-CAPS System to prevent CAPS-only msgs`,
                        emoji: "🅰️",
                    },
                    {
                        value: "setup-antidiscord",
                        description: `Configuración a Anit-DISCORD System to prevent DC-LINKS`,
                        emoji: allEmojis.msg.discord_robot,
                    },
                    {
                        value: "setup-antilink",
                        description: `Configuración a Anit-LINK System to prevent LINKS`,
                        emoji: "🔗",
                    },
                    {
                        value: "setup-antinuke",
                        description: `Configuración a Anit-NUKE System to prevent NUKES`,
                        emoji: allEmojis.msg.builder,
                    },
                    {
                        value: "setup-apply",
                        description: `Configuración up to 25 different Apply Systems`,
                        emoji: "📋",
                    },
                    {
                        value: "setup-autodelete",
                        description: `Configuración auto deletion Channels`,
                        emoji: "🗑️",
                    },
                    {
                        value: "setup-autoembed",
                        description: `Define Canal(s) to replace messages with EMBEDS`,
                        emoji: "📰",
                    },
                    {
                        value: "setup-automeme",
                        description: `Define a Canal to post MEMES every Minute`,
                        emoji: allEmojis.msg.automeme,
                    },
                    {
                        value: "setup-autonsfw",
                        description: `Define a Canal to post NSFW every Minute`,
                        emoji: "🔞",
                    },
                    {
                        value: "setup-blacklist",
                        description: `Manage the Word(s)-Blacklist`,
                        emoji: "🔠",
                    },
                    {
                        value: "setup-commands",
                        description: `Enable/Disable specific Commands`,
                        emoji: "⚙️",
                    },
                    {
                        value: "setup-counter",
                        description: `Configuración a fun Number-Counter Canal`,
                        emoji: "#️⃣",
                    },
                    {
                        value: "setup-customcommand",
                        description: `Configuración up to 25 different Personalizado-Commands`,
                        emoji: "⌨️",
                    },
                    {
                        value: "setup-dailyfact",
                        description: `Configuración a Canal to post daily Facts`,
                        emoji: "🗓",
                    },
                    {
                        value: "setup-embed",
                        description: `Configuración the Look of the Embeded Messages`,
                        emoji: "📕",
                    },
                    {
                        value: "setup-jtc",
                        description: `Configuración the Join-To-Create Canal(s)`,
                        emoji: "🔈",
                    },
                    {
                        value: "setup-keyword",
                        description: `Configuración up to 25 different Keyword-Messages`,
                        emoji: "📖",
                    },
                    {
                        value: "setup-language",
                        description: `Manage the Bot's Language`,
                        emoji: "🇬🇧",
                    },
                    {
                        value: "setup-leave",
                        description: `Manage the Leave Messages`,
                        emoji: "📤",
                    },
                    {
                        value: "setup-logger",
                        description: `Configuración the Audit-Log`,
                        emoji: "🛠",
                    },
                    {
                        value: "setup-membercount",
                        description: `Configuración up to 25 different Miembro-Counters`,
                        emoji: "📈",
                    },
                    {
                        value: "setup-radio",
                        description: `Configuración the Radio/Waitingroom System`,
                        emoji: "📻",
                    },
                    {
                        value: "setup-rank",
                        description: `Configuración the Ranking System`,
                        emoji: "📊",
                    },
                    {
                        value: "setup-reactionrole",
                        description: `Configuración Infinite Reaction Roles`,
                        emoji: "📌",
                    },
                    {
                        value: "setup-reportlog",
                        description: `Configuración the Report System & Canal`,
                        emoji: "🗃",
                    },
                    {
                        value: "setup-roster",
                        description: `Configuración the Roster System`,
                        emoji: "📜",
                    },
                    {
                        value: "setup-serverstats",
                        description: `Configuración up to 25 different Miembro-Counters`,
                        emoji: "📈",
                    },
                    {
                        value: "setup-suggestion",
                        description: `Configuración the Sugerencia System`,
                        emoji: "💡",
                    },
                    {
                        value: "setup-ticket",
                        description: `Configuración up to 25 different Ticket-Systems`,
                        emoji: "📨",
                    },
                    {
                        value: "setup-tiktok",
                        description: `Configuración up to 3 different TikTok Logger Channels`,
                        emoji: allEmojis.msg.tiktok,
                    },
                    {
                        value: "setup-twitch",
                        description: `Configuración up to 5 different Twitch Logger Channels`,
                        emoji: allEmojis.msg.twitch,
                    },
                    {
                        value: "setup-twitter",
                        description: `Configuración up to 2 different Twitter Logger Channels`,
                        emoji: allEmojis.msg.spotify,
                    },
                    {
                        value: "setup-validcode",
                        description: `Configuración the Valid-Code System`,
                        emoji: allEmojis.msg.validcode,
                    },
                    {
                        value: "setup-warn",
                        description: `Configuración the Warn System Ajustes`,
                        emoji: allEmojis.msg.warn,
                    },
                    {
                        value: "setup-welcome",
                        description: `Configuración the Bienvenido System/Messages`,
                        emoji: allEmojis.msg.channel,
                    },
                    {
                        value: "setup-youtube",
                        description: `Configuración up to 5 different Youtube Logger Channels`,
                        emoji: allEmojis.msg.youtube,
                    },
                ];
                let Selection1 = new StringSelectMenuBuilder()
                    .setPlaceholder("¡Haz clic para configurar the (1/3) Systems [A-C]!")
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
                    .setPlaceholder("¡Haz clic para configurar the (2/3) Systems [C-R]!")
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
                    .setPlaceholder("¡Haz clic para configurar the (3/3) Systems [R-Z]!")
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
                    .setAuthor({ name: "Setup-Systems | (1/3) [A-C]", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/lg/57/gear_2699.png", url: "https://github.com/melodiabl" })
                    .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup"]["variable1"]));
                let MenuEmbed2 = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setAuthor({ name: "Setup-Systems | (2/3) [C-R]", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/lg/57/gear_2699.png", url: "https://github.com/melodiabl" })
                    .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup"]["variable2"]));
                let MenuEmbed3 = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setAuthor({ name: "Setup-Systems | (3/3) [R-Z]", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/lg/57/gear_2699.png", url: "https://github.com/melodiabl" })
                    .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup"]["variable3"]));
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
                                content: `<:no:833101993668771842> ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                                ephemeral: true,
                            });
                    }
                    if (menu?.message.id === menumsg2.id) {
                        if (menu?.user.id === cmduser.id) {
                            menumsg2.edit({ components: [], embeds: menumsg2.embeds }).catch(() => {});
                            menuselection(menu);
                        } else
                            menu?.reply({
                                content: `<:no:833101993668771842> ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                                ephemeral: true,
                            });
                    }
                    if (menu?.message.id === menumsg3.id) {
                        if (menu?.user.id === cmduser.id) {
                            menumsg3.edit({ components: [], embeds: menumsg3.embeds }).catch(() => {});
                            menuselection(menu);
                        } else
                            menu?.reply({
                                content: `<:no:833101993668771842> ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
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
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup"]["variable10"])),
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
