const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const translate = require("translatte");
const { handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "translate",
    description: "Te da un enlace de invitación para este Bot",
    run: async (client, interaction, cmduser, es, ls, prefix, player, message) => {
        //things u can directly access in an interaction!
        const {
            member,
            channelId,
            guildId,
            applicationId,
            commandName,
            deferred,
            replied,
            ephemeral,
            options,
            id,
            createdTimestamp,
        } = interaction;
        const { guild } = member;

        try {
            if (!args[0])
                return interaction?.reply({
                    ephemeral: true,
                    content: handlemsg(client.la[ls].cmds.info.translate.error, { prefix: prefix }),
                });
            if (!args[1])
                return interaction?.reply({
                    ephemeral: true,
                    content: handlemsg(client.la[ls].cmds.info.translate.error, { prefix: prefix }),
                });
            if (!args[2])
                return interaction?.reply({
                    ephemeral: true,
                    content: handlemsg(client.la[ls].cmds.info.translate.error, { prefix: prefix }),
                });

            translate(args.slice(2).join(" "), { from: args[0], to: args[1] })
                .then(res => {
                    let embed = new EmbedBuilder()
                        .setColor(es.color)
                        .setAuthor({ name: handlemsg(client.la[ls].cmds.info.translate.to, { to: args[1] }), iconURL: 'https://imgur.com/0DQuCgg.png' })
                        .setFooter({ text: handlemsg(client.la[ls].cmds.info.translate.from, { from: args[0] }), iconURL: member.user.displayAvatarURL() })
                        .setDescription(eval(client.la[ls]["cmds"]["info"]["translate"]["variable1"]));
                    interaction?.reply({ ephemeral: true, embeds: [embed] });
                })
                .catch(err => {
                    let embed = new EmbedBuilder()
                        .setColor(RED)
                        .setTitle(client.la[ls].common.erroroccur)
                        .setDescription(String("```" + err.stack + "```").substring(0, 2000));
                    interaction?.reply({ ephemeral: true, embeds: [embed] });
                    console.log(err);
                });
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
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
