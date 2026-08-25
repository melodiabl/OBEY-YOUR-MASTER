var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-validcode",
    category: "💪 Setup",
    aliases: ["setupvalidcode", "validcode-setup", "validcodesetup"],
    cooldown: 5,
    usage: "setup-validcode --> Sigue los Pasos",
    description: "Esta Configuración te permite enviar registros a un Canal específico cuando alguien usa el Comando: report",
    memberpermissions: ['Administrador'],
    type: "fun",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            ///////////////////////////////////////
            ///////////////////////////////////////
            ///////////////////////////////////////

            //function to handle true/false
            const d2p = bool => (bool ? "`✔️ Enabled`" : "`❌ Disabled`");
            //call the first layer
            first_layer();

            //function to handle the FIRST LAYER of the SELECTION
            async function first_layer() {
                let menuoptions = [
                    {
                        value: `${client.settings.get(message.guild.id, `validcode`) ? "Disable" : "Enable"} Valid Code`,
                        description: client.settings.get(message.guild.id, `validcode`)
                            ? "Don't do anything with Messages containing Code"
                            : "React to messages containing a Valid Code Snippet",
                        emoji: client.settings.get(message.guild.id, `validcode`)
                            ? allEmojis.msg.ERROR
                            : allEmojis.msg.SUCCESS,
                    },
                    {
                        value: "Settings",
                        description: `Show the Current Ajustes of the Valid-Code System`,
                        emoji: allEmojis.msg.list,
                    },
                    {
                        value: "Cancel",
                        description: `Cancelar and stop the Ticket-Configuración!`,
                        emoji: allEmojis.msg.cancel,
                    },
                ];
                let Selection = new StringSelectMenuBuilder()
                    .setPlaceholder("¡Haz clic para configurar the Valid-Code System!")
                    .setCustomId("MenuSelection")
                    .setMaxValues(1)
                    .setMinValues(1)
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
                    .setAuthor({ name: "Valid-Code System Setup", iconURL: "https://cdn.discordapp.com/emojis/858405056238714930.gif?v=1", url: "https://github.com/melodiabl" })
                    .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-validcode"]["variable1"]));
                let used1 = false;
                //send the menu msg
                let menumsg = await message.reply({
                    embeds: [MenuEmbed],
                    components: [new ActionRowBuilder().addComponents(Selection)],
                });
                //function to handle the menuselection
                function menuselection(menu) {
                    let menuoptiondata = menuoptions.find(v => v.value == menu?.values[0]);
                    let menuoptionindex = menuoptions.findIndex(v => v.value == menu?.values[0]);
                    if (menu?.values[0] == "Cancel")
                        return menu?.reply(eval(client.la[ls]["cmds"]["setup"]["setup-validcode"]["variable2"]));
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
                                    content: `<:no:833101993668771842> You already selected something, this Selection is now disabled!`,
                                    ephemeral: true,
                                });
                            menuselection(menu);
                        } else
                            menu?.reply({
                                content: `<:no:833101993668771842> ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                                ephemeral: true,
                            });
                    }
                });
            }

            //THE FUNCTION TO HANDLE THE SELECTION PICS
            async function handle_the_picks(menuoptionindex, menuoptiondata) {
                switch (menuoptionindex) {
                    case 0: {
                        client.settings.set(
                            message.guild.id,
                            !client.settings.get(message.guild.id, `validcode`),
                            `validcode`
                        );
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-validcode"]["variable3"]))
                                    .setColor(es.color)
                                    .setFooter(client.getFooter(es)),
                            ],
                        });
                    }
                    case 1: {
                        let thesettings = client.settings.get(message.guild.id, `validcode`);
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle(eval(client.la[ls]["cmds"]["setup"]["setup-validcode"]["variable4"]))
                                    .setColor(es.color)
                                    .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-validcode"]["variable5"]))
                                    .setFooter(client.getFooter(es)),
                            ],
                        });
                    }
                }
            }

            ///////////////////////////////////////
            ///////////////////////////////////////
            ///////////////////////////////////////
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-validcode"]["variable6"])),
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
