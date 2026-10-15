const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder,
    ButtonStyle
} = require("discord.js");
const Discord = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const { handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "invite",
    category: "Info",
    aliases: ["add"],
    usage: "invite",
    description: "Gives you an Invite link for this Bot",
    type: "bot",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        try {
            let user = message.mentions.users.first() || client.user;
            if (user) {
                if (!user.bot)
                    return interaction?.reply({
                        ephemeral: true,
                        content: obeyUi.owned("<:no:833101993668771842> ¡No puedes invitar a un usuario normal! **DEBE SER UN BOT**"),
                    });
                let button_public_invite = new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel(obeyUi.plain(handlemsg(client.la[ls].cmds.info.invite.buttons.public)))
                    .setURL(
                        "https://discord.com/api/oauth2/authorize?client_id=734513783338434591&permissions=8&scope=bot%20applications.commands"
                    );
                let button_support_dc = new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel(obeyUi.plain(handlemsg(client.la[ls].cmds.info.invite.buttons.server)))
                    .setURL("https://github.com/melodiabl");
                let button_invite = new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel(obeyUi.plain("Invite " + user.username))
                    .setURL(
                        `https://discord.com/api/oauth2/authorize?client_id=${user.id}&permissions=8&scope=bot%20applications.commands`
                    );
                //array of all buttons
                const allbuttons = [
                    new ActionRowBuilder().addComponents([button_public_invite, button_support_dc, button_invite]),
                ];
                message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(ee.color)
                            .setTitle(obeyUi.limit(`Invite: __**${user.username}**__`, 256))
                            .setDescription(
                                obeyUi.limit(`||[*Click here for an Invitelink without Slash Commands*](https://discord.com/api/oauth2/authorize?client_id=${user.id}&permissions=8&scope=bot)||`, 4096)
                            )
                            .setURL(
                                `https://discord.com/api/oauth2/authorize?client_id=${user.id}&permissions=8&scope=bot%20applications.commands`
                            )
                            .setFooter(obeyMeta.asFooter(client.getFooter(`${user.username} | powered by github.com/melodiabl`, "https://imgur.com/jPItIw0.gif"))
                            ),
                    ],
                    components: allbuttons,
                });
            }
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.erroroccur, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["info"]["color"]["variable2"]), 4096)),
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
