const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require(`discord.js`);
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const fs = require("fs");
const { allEmojis } = require("../../botconfig/emojiFunctions");
module.exports = {
    name: `changeprefix`,
    category: "Owner",
    type: "bot",
    description: `Let's you change the Prefix of the BOT GLOBALLY (Unless a Guild has a different Setting)`,
    usage: `changeprefix <NEW PREFIX>`,
    memberpermissions: [`Administrator`],
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        if (!config.ownerIDS.some(r => r.includes(message.author.id)))
            return message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changename"]["variable1"]), 256))
                        .setDescription(
                            obeyUi.limit(eval(client.la[ls]["cmds"]["owner"]["changename"]["variable2"]) +
                                `\n\nIf you want to change the Settings for **this Server** then type use the \`${prefix}prefix <newprefix>\` Command`, 4096)
                        ),
                ],
            });
        try {
            //if no args return error
            if (!args[0])
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["settings"]["prefix"]["variable1"]), 256))
                            .setDescription(obeyUi.limit(`Current global Prefix: \`${config.prefix}\``, 4096)),
                    ],
                });
            //if there are multiple arguments
            if (args[1])
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["settings"]["prefix"]["variable3"]), 256)),
                    ],
                });
            //if the prefix is too long
            if (args[0].length > 5)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["settings"]["prefix"]["variable4"]), 256)),
                    ],
                });
            let status = config;
            status.prefix = args[0];
            fs.writeFile(`./botconfig/config.json`, JSON.stringify(status, null, 3), e => {
                if (e) {
                    console.log(e.stack ? String(e.stack).dim : String(e).dim);
                    return message.channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                .setColor(es.wrongcolor)
                                .setTitle(obeyUi.limit(`${obeyUi.markup("icon.error")} Something went wrong`, 256))
                                .setDescription(obeyUi.limit(`\`\`\`${String(e.message ? e.message : e).substring(0, 2000)}\`\`\``, 4096)),
                        ],
                    });
                }
                return message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setColor(es.color)
                            .setTitle(obeyUi.limit(`${allEmojis.msg.SUCCESS} Successfully changed the Prefix`, 256))
                            .setDescription(
                                obeyUi.limit(`**To change it in this Servidor use the: \`${prefix}prefix <newprefix>\` Comando!**`, 4096)
                            ),
                    ],
                });
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["settings"]["prefix"]["variable6"]), 4096)),
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
