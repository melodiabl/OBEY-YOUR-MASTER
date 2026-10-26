const obeyMeta = require("./presentation/metadata")
const Discord = require("discord.js"),
    CronJob = require("cron").CronJob;
const { reapplyRoleMute, processExpiredRoleMutes } = require('../src/modules/moderation/application/role-mute-worker')
module.exports = async client => {
    client.on("guildMemberAdd", member => {
        reapplyRoleMute(client, member).catch(error => console.error('[Mute] Restore retry pending:', error.message));
    });
    client.Jobmute = new CronJob(
        "*/5 * * * * *",
        () => processExpiredRoleMutes(client).catch(error => console.error('[Mute] Worker retry pending:', error.message)),
        null,
        true,
        "America/Los_Angeles"
    );
    client.Jobremind = new CronJob(
        "*/5 * * * * *",
        async function () {
            client.afkDB.ensure("REMIND", { REMIND: [] });
            let data = client.afkDB.get("REMIND") || { REMIND: [] };
            var reminds_now = data.REMIND.filter(v => {
                return v.time - (Date.now() - v.timestamp) <= 0;
            });
            if (reminds_now && reminds_now.length > 0) {
                reminds_now.forEach(async userData => {
                    let { content, at, time, guild, user, timestamp, channel, string_of_time } = userData;
                    try {
                        let es = client.settings.get(guild, "embed");
                        let ls = client.settings.get(guild, "language");

                        guild = client.guilds.cache.get(guild);
                        let member = await guild.members.fetch(user).catch(() => {});
                        let message = {
                            guild: {
                                name: guild.name,
                            },
                            channel: {
                                id: channel,
                            },
                        };
                        member
                            .send({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                        .setTitle(eval(client.la[ls]["cmds"]["schoolcommands"]["remind"]["variable12"]))
                                        .addFields({ name: eval(client.la[ls]["cmds"]["schoolcommands"]["remind"]["variablex_13"]), value: eval(client.la[ls]["cmds"]["schoolcommands"]["remind"]["variable13"]) })
                                        .addFields({ name: "Created at:", value: `\`${at}\`` })
                                        .setDescription(content),
                                ],
                            })
                            .catch(e => {
                                console.log(e.stack ? String(e.stack).grey : String(e).grey);
                                let channel = guild.channels.cache.get(channel);
                                if (channel) {
                                    channel.send({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setColor(es.color)
                                                .setThumbnail(
                                                    es.thumb
                                                        ? es.footericon &&
                                                          (es.footericon.includes("http://") ||
                                                              es.footericon.includes("https://"))
                                                            ? es.footericon
                                                            : client.user.displayAvatarURL()
                                                        : null
                                                )
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                                                .setTitle(
                                                    eval(client.la[ls]["cmds"]["schoolcommands"]["remind"]["variable12"])
                                                )
                                                .addFields({ name: eval(client.la[ls]["cmds"]["schoolcommands"]["remind"]["variablex_13"]), value: eval(client.la[ls]["cmds"]["schoolcommands"]["remind"]["variable13"]) })
                                                .addFields({ name: "Created at:", value: `\`${now}\`` })
                                                .setDescription(content),
                                        ],
                                        content: `<@${member.id}>`,
                                    });
                                }
                            });
                        client.afkDB.remove("REMIND", v => v.at == at && v.user == user, "REMIND");
                    } catch (e) {
                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        client.afkDB.remove("REMIND", v => v.at == at && v.user == user, "REMIND");
                    }
                });
            }
        },
        null,
        true,
        "America/Los_Angeles"
    );

    client.on("ready", () => {
        client.Jobmute.start();
        client.Jobremind.start();
    });
};
