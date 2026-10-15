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
    name: "setup-commands",
    category: "Setup",
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
                        emoji: obeyUi.component("💸"),
                        description: `${client.settings.get(message.guild.id, "ECONOMY") ? obeyUi.owned("❌ Desactivar Comandos ECONOMY") : obeyUi.owned("✅ Activar Comandos ECONOMY")}`,
                    },
                    {
                        label: "SCHOOL",
                        value: "SCHOOL",
                        emoji: obeyUi.component("🏫"),
                        description: `${client.settings.get(message.guild.id, "SCHOOL") ? obeyUi.owned("❌ Desactivar SCHOOL") : obeyUi.owned("✅ Activar SCHOOL")}`,
                    },
                    {
                        label: "MUSIC",
                        value: "MUSIC",
                        emoji: obeyUi.component("🎶"),
                        description: `${client.settings.get(message.guild.id, "MUSIC") ? obeyUi.owned("❌ Desactivar Music") : obeyUi.owned("✅ Activar Music")}`,
                    },
                    {
                        label: "FILTER",
                        value: "FILTER",
                        emoji: obeyUi.component("👀"),
                        description: `${client.settings.get(message.guild.id, "FILTER") ? obeyUi.owned("❌ Desactivar FILTER") : obeyUi.owned("✅ Activar FILTER")}`,
                    },
                    {
                        label: "CUSTOMQUEUE",
                        value: "CUSTOMQUEUE",
                        emoji: obeyUi.component("⚜️"),
                        description: `${client.settings.get(message.guild.id, "CUSTOMQUEUE") ? obeyUi.owned("❌ Desactivar CUSTOM-QUEUE") : obeyUi.owned("✅ Activar CUSTOM-QUEUE")}`,
                    },
                    {
                        label: "PROGRAMMING",
                        value: "PROGRAMMING",
                        emoji: obeyUi.component("⌨️"),
                        description: `${client.settings.get(message.guild.id, "PROGRAMMING") ? obeyUi.owned("❌ Desactivar PROGRAMMING") : obeyUi.owned("✅ Activar PROGRAMMING")}`,
                    },
                    {
                        label: "RANKING",
                        value: "RANKING",
                        emoji: obeyUi.component("📈"),
                        description: `${client.settings.get(message.guild.id, "RANKING") ? obeyUi.owned("❌ Desactivar RANKING") : obeyUi.owned("✅ Activar RANKING")}`,
                    },
                    {
                        label: "SOUNDBOARD",
                        value: "SOUNDBOARD",
                        emoji: obeyUi.component("🔊"),
                        description: `${client.settings.get(message.guild.id, "SOUNDBOARD") ? obeyUi.owned("❌ Desactivar SOUNDBOARD") : obeyUi.owned("✅ Activar SOUNDBOARD")}`,
                    },
                    {
                        label: "VOICE",
                        value: "VOICE",
                        emoji: obeyUi.component("🎤"),
                        description: `${client.settings.get(message.guild.id, "VOICE") ? obeyUi.owned("❌ Desactivar VOICE") : obeyUi.owned("✅ Activar VOICE")}`,
                    },
                    {
                        label: "FUN",
                        value: "FUN",
                        emoji: obeyUi.component("🕹️"),
                        description: `${client.settings.get(message.guild.id, "FUN") ? obeyUi.owned("❌ Desactivar FUN") : obeyUi.owned("✅ Activar FUN")}`,
                    },
                    {
                        label: "MINIGAMES",
                        value: "MINIGAMES",
                        emoji: obeyUi.component("🎮"),
                        description: `${client.settings.get(message.guild.id, "MINIGAMES") ? obeyUi.owned("❌ Desactivar MINIGAMES") : obeyUi.owned("✅ Activar MINIGAMES")}`,
                    },
                    {
                        label: "ANIME",
                        value: "ANIME",
                        emoji: obeyUi.component("😳"),
                        description: `${client.settings.get(message.guild.id, "ANIME") ? obeyUi.owned("❌ Desactivar ANIME") : obeyUi.owned("✅ Activar ANIME")}`,
                    },
                ];
            }
            function getMenuRowComponent() {
                let menuOptions = getMenuOptions();
                let menuSelection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setPlaceholder(obeyUi.plain("Click: enable/disable Command-Categories"))
                    .setMinValues(1)
                    .setMaxValues(menuOptions.length)
                    .addOptions(menuOptions.filter(Boolean));
                return [new ActionRowBuilder().addComponents(menuSelection)];
            }

            let embed = new Discord.EmbedBuilder()
                .setTitle(obeyUi.limit(`Configuración the allowed/not-allowed Comando-Categories of this Servidor`, 256))
                .setColor(es.color)
                .setDescription(
                    obeyUi.limit(`**In the selection down below all Categories are listed**\n\n**Seleccionar it to either disable/enable it!**\n\n**You can select all (*at least 1*) Command-Categories if you want to disable/enable all of them at once!**`, 4096)
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
                            obeyUi.limit(`${getMenuOptions()
                                .map(
                                    option =>
                                        `> ${option.emoji} **${option.value}-Comandos**: ${option.description.split(" ")[0] != "❌" ? `\`Ahora desactivados [❌]\`` : `\`Ahora activados [✅]\``}`
                                )
                                .join("\n\n")}`, 4096)
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
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-commands"]["variable5"]), 4096)),
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
