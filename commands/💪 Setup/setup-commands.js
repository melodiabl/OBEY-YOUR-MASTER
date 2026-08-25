var { EmbedBuilder } = require(`discord.js`);
var Discord = require(`discord.js`);
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/botconfig/emojis.json`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
const { ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: "setup-commands",
    category: "💪 Setup",
    aliases: ["setupcommands", "setup-command", "setupcommand"],
    cooldown: 5,
    usage: "setup-commands --> Sigue los Pasos",
    description: "Activar/Desactivar Comandos específicos",
    memberpermissions: ['Administrador'],
    type: "info",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            function getMenuOptions() {
                return [
                    {
                        label: "ECONOMY",
                        value: "ECONOMY",
                        emoji: "💸",
                        description: `${client.settings.get(message.guild.id, "ECONOMY") ? "❌ Desactivar Comandos ECONOMY" : "✅ Activar Comandos ECONOMY"}`,
                    },
                    {
                        label: "SCHOOL",
                        value: "SCHOOL",
                        emoji: "🏫",
                        description: `${client.settings.get(message.guild.id, "SCHOOL") ? "❌ Desactivar SCHOOL" : "✅ Activar SCHOOL"}`,
                    },
                    {
                        label: "MUSIC",
                        value: "MUSIC",
                        emoji: "🎶",
                        description: `${client.settings.get(message.guild.id, "MUSIC") ? "❌ Desactivar Music" : "✅ Activar Music"}`,
                    },
                    {
                        label: "FILTER",
                        value: "FILTER",
                        emoji: "👀",
                        description: `${client.settings.get(message.guild.id, "FILTER") ? "❌ Desactivar FILTER" : "✅ Activar FILTER"}`,
                    },
                    {
                        label: "CUSTOMQUEUE",
                        value: "CUSTOMQUEUE",
                        emoji: "⚜️",
                        description: `${client.settings.get(message.guild.id, "CUSTOMQUEUE") ? "❌ Desactivar CUSTOM-QUEUE" : "✅ Activar CUSTOM-QUEUE"}`,
                    },
                    {
                        label: "PROGRAMMING",
                        value: "PROGRAMMING",
                        emoji: "⌨️",
                        description: `${client.settings.get(message.guild.id, "PROGRAMMING") ? "❌ Desactivar PROGRAMMING" : "✅ Activar PROGRAMMING"}`,
                    },
                    {
                        label: "RANKING",
                        value: "RANKING",
                        emoji: "📈",
                        description: `${client.settings.get(message.guild.id, "RANKING") ? "❌ Desactivar RANKING" : "✅ Activar RANKING"}`,
                    },
                    {
                        label: "SOUNDBOARD",
                        value: "SOUNDBOARD",
                        emoji: "🔊",
                        description: `${client.settings.get(message.guild.id, "SOUNDBOARD") ? "❌ Desactivar SOUNDBOARD" : "✅ Activar SOUNDBOARD"}`,
                    },
                    {
                        label: "VOICE",
                        value: "VOICE",
                        emoji: "🎤",
                        description: `${client.settings.get(message.guild.id, "VOICE") ? "❌ Desactivar VOICE" : "✅ Activar VOICE"}`,
                    },
                    {
                        label: "FUN",
                        value: "FUN",
                        emoji: "🕹️",
                        description: `${client.settings.get(message.guild.id, "FUN") ? "❌ Desactivar FUN" : "✅ Activar FUN"}`,
                    },
                    {
                        label: "MINIGAMES",
                        value: "MINIGAMES",
                        emoji: "🎮",
                        description: `${client.settings.get(message.guild.id, "MINIGAMES") ? "❌ Desactivar MINIGAMES" : "✅ Activar MINIGAMES"}`,
                    },
                    {
                        label: "ANIME",
                        value: "ANIME",
                        emoji: "😳",
                        description: `${client.settings.get(message.guild.id, "ANIME") ? "❌ Desactivar ANIME" : "✅ Activar ANIME"}`,
                    },
                    {
                        label: "NSFW",
                        value: "NSFW",
                        emoji: "🔞",
                        description: `${client.settings.get(message.guild.id, "NSFW") ? "❌ Desactivar NSFW" : "✅ Activar NSFW"}`,
                    },
                ];
            }
            function getMenuRowComponent() {
                let menuOptions = getMenuOptions();
                let menuSelection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setPlaceholder("Click: enable/disable Command-Categories")
                    .setMinValues(1)
                    .setMaxValues(menuOptions.length)
                    .addOptions(menuOptions.filter(Boolean));
                return [new ActionRowBuilder().addComponents(menuSelection)];
            }

            let embed = new Discord.EmbedBuilder()
                .setTitle(`Configuración the allowed/not-allowed Comando-Categories of this Servidor`)
                .setColor(es.color)
                .setDescription(
                    `**In the selection down below all Categories are listed**\n\n**Seleccionar it to either disable/enable it!**\n\n**You can select all (*at least 1*) Command-Categories if you want to disable/enable all of them at once!**`
                );

            //Send message with buttons
            let msg = await message.reply({
                embeds: [embed],
                components: getMenuRowComponent(),
            });
            const collector = msg.createMessageComponentCollector({
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
                    let oldstate = client.settings.get(message.guild.id, `${value.toUpperCase()}`);
                    if (!oldstate) enabled++;
                    else disabled++;
                    client.settings.set(message.guild.id, !oldstate, `${value.toUpperCase()}`);
                }
                b?.reply(
                    `${allEmojis.msg.SUCCESS} **\`Activado ${enabled} Categorías de Comandos\` y \`Desactivado ${disabled} Categorías de Comandos\` de \`${b?.values.length} Categorías de Comandos seleccionadas\`**`
                );
            });
            collector.on("end", () => {
                msg.edit({
                    content: `${allEmojis.msg.ERROR} Time ran out/Input finished! Cancelado`,
                    embeds: [
                        EmbedBuilder.from(msg.embeds[0]).setDescription(
                            `${getMenuOptions()
                                .map(
                                    option =>
                                        `> ${option.emoji} **${option.value}-Comandos**: ${option.description.split(" ")[0] != "❌" ? `\`Ahora desactivados [❌]\`` : `\`Ahora activados [✅]\``}`
                                )
                                .join("\n\n")}`
                        ),
                    ],
                    components: [],
                }).catch(e => {});
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(client.getFooter(es))
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(eval(client.la[ls]["cmds"]["setup"]["setup-commands"]["variable5"])),
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
