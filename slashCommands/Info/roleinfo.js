const { EmbedBuilder } = require("discord.js");
const moment = require("moment");
module.exports = {
    name: "roleinfo",
    description: "Obtén información sobre un rol",
    options: [
        //{"Integer": { name: "ping_amount", description: "How many times do you want to ping?", required: true }}, //to use in the code: interacton.getInteger("ping_amount")
        //{"String": { name: "ping_amount", description: "How many times do you want to ping?", required: true }}, //to use in the code: interacton.getString("ping_amount")
        { Role: { name: "what_role", description: "De qué rol quieres obtener información?", required: true } }, //to use in the code: interacton.getUser("ping_a_user")
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
        try {
            var role = options.getRole("what_role");
            if (!role || role == null || role.id == null || !role.id)
                return interaction?.reply(client.la[ls].common.rolenotfound);
            //create the EMBED
            const embeduserinfo = new EmbedBuilder();
            embeduserinfo.setThumbnail(guild.iconURL({ size: 512 }));
            embeduserinfo.setAuthor({
                name: client.la[ls].cmds.info.roleinfo.author + " " + role.name,
                iconURL: guild.iconURL(),
                url: "https://github.com/melodiabl"
            });
            embeduserinfo.addFields(
                { name: client.la[ls].cmds.info.roleinfo.field1, value: `\`${role.name}\``, inline: true },
                { name: client.la[ls].cmds.info.roleinfo.field2, value: `\`${role.id}\``, inline: true },
                { name: client.la[ls].cmds.info.roleinfo.field3, value: `\`${role.hexColor}\``, inline: true },
                { name: client.la[ls].cmds.info.roleinfo.field4, value: "`" + moment(role.createdAt).format("DD/MM/YYYY") + "`\n`" + moment(role.createdAt).format("hh:mm:ss") + "`", inline: true },
                { name: client.la[ls].cmds.info.roleinfo.field5, value: `\`${role.rawPosition}\``, inline: true },
                { name: client.la[ls].cmds.info.roleinfo.field6, value: `\`${role.members.size} Members have it\``, inline: true },
                { name: client.la[ls].cmds.info.roleinfo.field7, value: `\`${role.hoist ? "✔️" : "❌"}\``, inline: true },
                { name: client.la[ls].cmds.info.roleinfo.field8, value: `\`${role.mentionable ? "✔️" : "❌"}\``, inline: true },
                { name: client.la[ls].cmds.info.roleinfo.field9, value: `${role.permissions.toArray().map(p => `\`${p}\``).join(", ")}` }
            );
            embeduserinfo.setColor(role.hexColor);
            embeduserinfo.setFooter(client.getFooter(es));
            //send the EMBED
            interaction?.reply({ ephemeral: true, embeds: [embeduserinfo] });
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
