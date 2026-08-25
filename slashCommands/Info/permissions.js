const Discord = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/botconfig/emojis.json`);
const moment = require("moment");
const { GetUser, GetGlobalUser } = require(`${process.cwd()}/handlers/functions`);
const { handlemsg } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "permissions",
    description: "Obtén información de permisos sobre un usuario",
    options: [
        //{"Integer": { name: "ping_amount", description: "How many times do you want to ping?", required: true }}, //to use in the code: interacton.getInteger("ping_amount")
        //{"String": { name: "ping_amount", description: "How many times do you want to ping?", required: true }}, //to use in the code: interacton.getString("ping_amount")
        { User: { name: "which_user", description: "De qué usuario quieres ver los permisos?", required: false } }, //to use in the code: interacton.getUser("ping_a_user")
        //{"Channel": { name: "what_channel", description: "To Ping a Canal lol", required: false }}, //to use in the code: interacton.getChannel("what_channel")
        //{"Role": { name: "what_role", description: "To Ping a Rol lol", required: false }}, //to use in the code: interacton.getRole("what_role")
        //{"IntChoices": { name: "what_ping", description: "What Ping do you want to get?", required: true, choices: [["Bot", 1], ["Discord Api", 2]] }, //here the second array input MUST BE A NUMBER // TO USE IN THE CODE: interacton.getInteger("what_ping")
        //{"StringChoices": { name: "what_ping", description: "What Ping do you want to get?", required: true, choices: [["Bot", "botping"], ["Discord Api", "api"]] }}, //here the second array input MUST BE A STRING // TO USE IN THE CODE: interacton.getString("what_ping")
    ],
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
        let user = options.getUser("which_user");
        if (!user) user = member.user;
        try {
            try {
                const member = guild.members.cache.get(user.id);
                //create the EMBED
                const embeduserinfo = new EmbedBuilder();
                embeduserinfo.setThumbnail(member.user.displayAvatarURL({ size: 512 }));
                embeduserinfo.setAuthor({ name: handlemsg(client.la[ls].cmds.info.permissions.from, { usertag: member.user.username }), iconURL: member.user.displayAvatarURL() });
                embeduserinfo.addFields({ name: handlemsg(client.la[ls].cmds.info.permissions.from2), value: `${member.permissions
                        .toArray()
                        .map(p => `\`${p}\``)
                        .join(", ")}` });
                embeduserinfo
                    .setColor(es.color)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : null
                    );
                embeduserinfo.setFooter(client.getFooter(es));
                //send the EMBED
                interaction?.reply({ ephemeral: true, embeds: [embeduserinfo] });
            } catch (e) {
                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                //create the EMBED
                const embeduserinfo = new EmbedBuilder();
                embeduserinfo.setThumbnail(user.displayAvatarURL({ size: 512 }));
                embeduserinfo.setAuthor({ name: handlemsg(client.la[ls].cmds.info.permissions.from, { usertag: member.user.username }), iconURL: member.user.displayAvatarURL() });
                embeduserinfo.addFields({ name: handlemsg(client.la[ls].cmds.info.permissions.from2), value: `${member.permissions
                        .toArray()
                        .map(p => `\`${p}\``)
                        .join(", ")}` });
                embeduserinfo
                    .setColor(es.color)
                    .setThumbnail(
                        es.thumb
                            ? es.footericon && (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                ? es.footericon
                                : client.user.displayAvatarURL()
                            : null
                    );
                embeduserinfo.setFooter(client.getFooter(es));
                //send the EMBED
                interaction?.reply({ ephemeral: true, embeds: [embeduserinfo] });
            }
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
