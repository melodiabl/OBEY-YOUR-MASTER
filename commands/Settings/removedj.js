const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require(`discord.js`);
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
module.exports = {
    name: `removedj`,
    aliases: [`deletedj`],
    category: "Settings",
    description: `Let's you DELETE a DJ ROLE`,
    usage: `removedj @ROLE`,
    memberpermissions: [`Administrator`],
    type: "music",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            //get the role of the mention
            let role = message.mentions.roles.filter(role => role.guild.id == message.guild.id).first();
            //if no pinged role return error
            if (!role)
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["settings"]["removedj"]["variable1"]), 256)),
                    ],
                });
            //try to find the role in the guild just incase he pings a role of a different server
            try {
                message.guild.roles.cache.get(role.id);
            } catch {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["settings"]["removedj"]["variable2"]), 256)),
                    ],
                });
            }
            //if its not in the database return error
            if (!client.settings.get(message.guild.id, `djroles`).includes(role.id))
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(es.wrongcolor)
                            .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                            .setTitle(obeyUi.limit(`${obeyUi.markup("icon.error")} **This Rol is not a DJ-Rol!**`, 256)),
                    ],
                });
            //remove it from the Database
            client.settings.remove(message.guild.id, role.id, `djroles`);
            //These lines create the String for all left Roles
            var leftb = client.settings.get(message.guild.id, `djroles`).map(r => `<@&${r}>`);
            if (leftb?.length == 0) leftb = "`not setup`";
            else leftb?.join(", ");
            //send the success message
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.color)
                        .setThumbnail(
                            es.thumb
                                ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                    ? es.footericon
                                    : client.user.displayAvatarURL()
                                : null
                        )
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["settings"]["removedj"]["variable4"]), 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["settings"]["removedj"]["variable5"]), 4096)),
                ],
            });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["settings"]["removedj"]["variable6"]), 4096)),
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
