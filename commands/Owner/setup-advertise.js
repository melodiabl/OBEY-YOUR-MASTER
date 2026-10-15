const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder, ButtonBuilder, ActionRowBuilder, MessageMenuOption, StringSelectMenuBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const fs = require("fs");
const { allEmojis } = require("../../botconfig/emojiFunctions");
var { databasing, isValidURL } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "setup-advertise",
    category: "Owner",
    aliases: ["setup-advert", "setupadvertise", "setupadvert"],
    cooldown: 5,
    usage: "setup-advertise  -->  Follow the Steps",
    type: "bot",
    description: "Changes if the Advertisement of github.com/melodiabl Should be there or NOT",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        if (!config.ownerIDS.some(r => r.includes(message.author.id)))
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-advertise"]["variable1"]), 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-advertise"]["variable2"]), 4096)),
                ],
            });
        try {
            first_layer();
            async function first_layer() {
                let menuoptions = [
                    {
                        value: `${client.ad.enabled ? "Disable" : "Enable"} Advertisement`,
                        description: `${client.ad.enabled ? "Disables the Ads from Bero-Host and melodia" : "Enables the Ads from Bero-Host and melodia"}`,
                        emoji: obeyUi.component(client.ad.enabled ? emoji?.react.ERROR : emoji?.react.SUCCESS),
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
                    .setPlaceholder(obeyUi.plain("Click me to setup the Advertising System!"))
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
                    .setAuthor(obeyMeta.asAuthor({ name: "Advertising Setup", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/prohibited_1f6ab?.png", url: "https://github.com/melodiabl" }))
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
                                return menu?.reply(
                                    {
                                        content: `${obeyUi.markup("icon.error")} You already selected something, this Selection is now disabled!`,
                                    },
                                    { ephermal: true }
                                );
                            menuselection(menu);
                        } else
                            menu?.reply(
                                {
                                    content: `${obeyUi.markup("icon.error")} You are not allowed to do that! Only: <@${cmduser.id}>`,
                                },
                                { ephermal: true }
                            );
                    }
                });
            }

            const d2p = bool => (bool ? obeyUi.owned("`✔️ Enabled`") : obeyUi.owned("`❌ Disabled`"));
            const d2p2 = bool => (bool ? obeyUi.owned("`✔️ Yes`") : obeyUi.owned("`❌ Nope`"));

            async function handle_the_picks(menuoptionindex, menuoptiondata) {
                switch (menuoptionindex) {
                    case 0:
                        {
                            let advertisement = require("../../botconfig/advertisement.json");
                            advertisement.adenabled = !advertisement.adenabled;
                            fs.writeFile(`./botconfig/advertisement.json`, JSON.stringify(advertisement, null, 3), e => {
                                if (e) {
                                    console.log(e.stack ? String(e.stack).dim : String(e).dim);
                                    return message.channel.send({
                                        embedq: [
                                            new EmbedBuilder()
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                .setColor(es.wrongcolor)
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-advertise"]["variable6"]), 256)
                                                )
                                                .setDescription(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-advertise"]["variable7"]), 4096)
                                                ),
                                        ],
                                    });
                                }
                                let advertisement = require("../../botconfig/advertisement.json");
                                client.ad.enabled = advertisement.adenabled;
                                client.ad.statusad = advertisement.statusad;
                                client.ad.spacedot = advertisement.spacedot;
                                client.ad.textad = advertisement.textad;
                                return message.channel.send({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                            .setColor(es.color)
                                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-advertise"]["variable8"]), 256)),
                                    ],
                                });
                            });
                        }
                        break;
                    case 1:
                        {
                            var embed = new EmbedBuilder()
                                .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-advertise"]["variable9"]), 256))
                                .setColor(es.color)
                                .setThumbnail(
                                    es.thumb
                                        ? es.footericon &&
                                          (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                            ? es.footericon
                                            : client.user.displayAvatarURL()
                                        : null
                                )
                                .setDescription(
                                    obeyUi.limit(`**Activado:** ${d2p2(client.ad.enabled)}\n**Statusad:** \`${client.ad.statusad.name}\`\n**Textad:** \`${client.ad.textad}\`\n**Space Dot:** \`${client.ad.spacedot}\``.substring(
                                        0,
                                        2048
                                    ), 4096)
                                )
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)));

                            return message.channel.send({ embeds: [embed] });
                        }
                        break;
                    default:
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
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["setup-advertise"]["variable10"]), 4096)),
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
