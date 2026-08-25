var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-autowarn",
    category: "💪 Setup",
    aliases: ["setupautowarn", "autowarn-setup", "autowarnsetup", "autowarnsystem"],
    cooldown: 5,
    usage: "setup-autowarn --> Follow Steps",
    description:
        "Enable / Disable Auto-Warn-Rules, on my Security Systems, like antispam, anticaps, antilinks, blacklist and more!",
    memberpermissions: ['Administrador'],
    type: "security",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            client.settings.ensure(message.guild.id, {
                autowarn: {
                    antispam: false,
                    antiselfbot: false,
                    antimention: false,
                    antilinks: false,
                    antidiscord: false,
                    anticaps: false,
                    blacklist: false,
                    ghost_ping_detector: false,
                },
            });
            first_layer();
            async function first_layer() {
                function getMenuOptions() {
                    return [
                        {
                            label: "Anti Spam",
                            value: `antispam`,
                            description: `${client.settings.get(message.guild.id, "autowarn.antispam") ? "Disable Auto warning if someone spams" : "Enable Auto warning if someone spams"}`,
                            emoji: `${client.settings.get(message.guild.id, "autowarn.antispam") ? "❌" : "✅"}`,
                        },
                        {
                            label: "Anti Mention",
                            value: `antimention`,
                            description: `${client.settings.get(message.guild.id, "autowarn.antimention") ? "Disable Auto warning if someone mentions" : "Enable Auto warning if someone mentions"}`,
                            emoji: `${client.settings.get(message.guild.id, "autowarn.antimention") ? "❌" : "✅"}`,
                        },
                        {
                            label: "Anti Links",
                            value: `antilinks`,
                            description: `${client.settings.get(message.guild.id, "autowarn.antilinks") ? "Disable Auto warning if someone send Links" : "Enable Auto warning if someone send Links"}`,
                            emoji: `${client.settings.get(message.guild.id, "autowarn.antilinks") ? "❌" : "✅"}`,
                        },
                        {
                            label: "Anti Discord",
                            value: `antidiscord`,
                            description: `${client.settings.get(message.guild.id, "autowarn.antidiscord") ? "Disable Auto warning if someone send Discord Links" : "Enable Auto warning if someone Discord Links"}`,
                            emoji: `${client.settings.get(message.guild.id, "autowarn.antidiscord") ? "❌" : "✅"}`,
                        },
                        {
                            label: "Anti Caps",
                            value: `anticaps`,
                            description: `${client.settings.get(message.guild.id, "autowarn.anticaps") ? "Disable Auto warning if someone send CAPS" : "Enable Auto warning if someone send CAPS"}`,
                            emoji: `${client.settings.get(message.guild.id, "autowarn.anticaps") ? "❌" : "✅"}`,
                        },
                        {
                            label: "Blacklist",
                            value: `blacklist`,
                            description: `${client.settings.get(message.guild.id, "autowarn.blacklist") ? "Disable Auto warn if someone send blacklist words" : "Enable Auto warn if someone send blacklist word"}`,
                            emoji: `${client.settings.get(message.guild.id, "autowarn.blacklist") ? "❌" : "✅"}`,
                        },
                        {
                            label: "Ghost Ping Detector",
                            value: `ghost_ping_detector`,
                            description: `${client.settings.get(message.guild.id, "autowarn.ghost_ping_detector") ? "Disable Auto warning if someone ghost pings" : "Enable Auto warning if someone ghost pings"}`,
                            emoji: `${client.settings.get(message.guild.id, "autowarn.ghost_ping_detector") ? "❌" : "✅"}`,
                        },
                        {
                            label: "Anti Self Bot",
                            value: `antiselfbot`,
                            description: `${client.settings.get(message.guild.id, "autowarn.antiselfbot") ? "Disable the Self Bot Detector" : "Enable the Self Bot Detector"}`,
                            emoji: `${client.settings.get(message.guild.id, "autowarn.antiselfbot") ? "❌" : "✅"}`,
                        },
                    ];
                }
                let menuoptions = getMenuOptions();
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(menuoptions.length) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder("Select all Auto-Warn Rules you want to enable/disable")
                    .addOptions(menuoptions);

                //define the embed
                let MenuEmbed = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setAuthor({ name: "Auto-Warn Setup", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/prohibited_1f6ab?.png", url: "https://github.com/melodiabl" })
                    .setDescription(
                        "***Seleccionar all Auto-Warn Rules you want to enable/disable in the `Selection` down below!***\n> *The Warns will only be applied, if the responsible System for it, is enabled!*\n> **You must select at least 1 or more!**"
                    );
                //send the menu msg
                let menumsg = await message.reply({
                    embeds: [MenuEmbed],
                    components: [new ActionRowBuilder().addComponents(Selection)],
                });
                const collector = menumsg.createMessageComponentCollector({
                    filter: i => i?.isStringSelectMenu() && i?.user && i?.message.author.id == client.user.id,
                    time: 180e3,
                    max: 1,
                });
                collector.on("collect", async b => {
                    if (b?.user.id !== message.author.id)
                        return b?.reply({
                            content: `${allEmojis.msg.ERROR} Only the one who typed the Comando is allowed to select Things!`,
                            ephemeral: true,
                        });

                    let enabled = 0,
                        disabled = 0;
                    for (const value of b?.values) {
                        console.log(value);
                        let oldstate = client.settings.get(message.guild.id, `autowarn.${value.toLowerCase()}`);
                        if (!oldstate) enabled++;
                        else disabled++;
                        client.settings.set(message.guild.id, !oldstate, `autowarn.${value.toLowerCase()}`);
                    }
                    b?.reply(
                        `${allEmojis.msg.SUCCESS} **\`Activado ${enabled} Auto-Warn-Rules\` and \`Desactivado ${disabled} Auto-Warn-Rules\` out of \`${b?.values.length} selected Auto-Warn-Rules\`**`
                    );
                });
                collector.on("end", () => {
                    menumsg
                        .edit({
                            content: `${allEmojis.msg.ERROR} Time ran out/Input finished! Cancelado`,
                            embeds: [
                                EmbedBuilder.from(menumsg.embeds[0]).setDescription(
                                    `${getMenuOptions()
                                        .map(
                                            option =>
                                                `> ${option.emoji == "✅" ? "❌" : "✅"} **${option.value}-Auto-Warn-Rules**: ${option.description.includes("disabled") ? `\`Now Disabled [❌]\`` : `\`Now Enabled [✅]\``}`
                                        )
                                        .join("\n\n")}`
                                ),
                            ],
                            components: [],
                        })
                        .catch(e => {});
                });
            }
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-warn"]["variable40"])),
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
