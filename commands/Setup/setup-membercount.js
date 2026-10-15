const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
var { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ChannelType } = require(`discord.js`);
var Discord = require(`discord.js`);
const { getNumberEmojis } = require("../../botconfig/emojiFunctions");
var config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
var emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
var { databasing } = require(`${process.cwd()}/handlers/functions`);
module.exports = {
    name: "setup-membercount",
    category: "Setup",
    aliases: ["setupmembercount", "membercount-setup", "membercountsetup", "setup-membercounter", "setupmembercounter"],
    cooldown: 5,
    usage: "setup-membercount --> Sigue los Pasos",
    description:
        "This Configuración allows you to specify a Canal which Name should be renamed every 10 Minutes to a Miembro Counter of Bots, Users, or Members",
    memberpermissions: ['Administrador'],
    type: "system",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        //ensure the database
        let ensureobject = {};
        for (let i = 1; i <= 25; i++) {
            ensureobject[`channel${i}`] = "no";
            ensureobject[`message${i}`] = obeyUi.owned("🗣 Members: {member}");
        }
        client.setups.ensure(message.guild.id, ensureobject, "membercount");
        try {
            const NumberEmojis = getNumberEmojis();
            first_layer();
            async function first_layer() {
                let menuoptions = [];
                for (let i = 1; i <= 25; i++) {
                    const emoji = NumberEmojis[i];
                    menuoptions.push({
                        value: `${i} Member Counter`,
                        description: `Manage/Edit the ${i}. Miembro Counter`,
                        ...(emoji ? { emoji } : {}),
                    });
                }
                //define the selection
                let Selection = new StringSelectMenuBuilder()
                    .setCustomId("MenuSelection")
                    .setMaxValues(1) //OPTIONAL, this is how many values you can have at each selection
                    .setMinValues(1) //OPTIONAL , this is how many values you need to have at each selection
                    .setPlaceholder(obeyUi.plain("¡Haz clic para configurar the Member Counter!"))
                    .addOptions(
                        menuoptions.map(option => {
                            let Obj = {
                                label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                value: option.value.substring(0, 50),
                                description: option.description.substring(0, 50),
                            };
                            if (option.emoji) Obj.emoji = option.emoji;
                            return Obj;
                        })
                    );

                //define the embed
                let MenuEmbed = new Discord.EmbedBuilder()
                    .setColor(es.color)
                    .setAuthor(obeyMeta.asAuthor({ name: "Member Counter Setup", iconURL: obeyUi.image("icon.roles"), url: "https://github.com/melodiabl" }))
                    .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable2"]), 4096));
                let used1 = false;
                //send the menu msg
                let menumsg = await message.reply({
                    embeds: [MenuEmbed],
                    components: [new ActionRowBuilder().addComponents(Selection)],
                });
                //function to handle the menuselection
                function menuselection(menu) {
                    let menuoptiondata = menuoptions.find(v => v.value == menu?.values[0]);
                    if (menu?.values[0] == "Cancel")
                        return menu?.reply(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"]));
                    menu?.deferUpdate();
                    let SetupNumber = menu?.values[0].split(" ")[0];
                    used1 = true;
                    second_layer(SetupNumber, menuoptiondata);
                }
                //Create the collector
                const collector = menumsg.createMessageComponentCollector({
                    filter: i => i?.isStringSelectMenu() && i?.message.author.id == client.user.id && i?.user,
                    time: 90000,
                });
                //Menu Collections
                collector.on("collect", menu => {
                    if (menu?.user.id === cmduser.id) {
                        collector.stop();
                        let menuoptiondata = menuoptions.find(v => v.value == menu?.values[0]);
                        if (menu?.values[0] == "Cancel")
                            return menu?.reply(eval(client.la[ls]["cmds"]["setup"]["setup-ticket"]["variable3"]));
                        menuselection(menu);
                    } else
                        menu?.reply({
                            content: `${obeyUi.markup("icon.error")} ¡No tienes permiso para hacer eso! Solo: <@${cmduser.id}>`,
                            ephemeral: true,
                        });
                });
                //Once the Collections ended edit the menu message
                collector.on("end", collected => {
                    menumsg.edit({
                        embeds: [EmbedBuilder.from(menumsg.embeds[0]).setDescription(obeyUi.limit(`~~${menumsg.embeds[0].description}~~`, 4096))],
                        components: [],
                        content: `${collected && collected.first() && collected.first().values ? `${allEmojis.msg.SUCCESS} **Selected: \`${collected ? collected.first().values[0] : "Nothing"}\`**` : obeyUi.owned("❌ **NOTHING SELECTED - CANCELLED**")}`,
                    });
                });
            }
            async function second_layer(SetupNumber, menuoptiondata) {
                var tempmsg = await message.reply({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-membercount"]["variable6"]), 256))
                            .setColor(es.color)
                            .setThumbnail(
                                es.thumb
                                    ? es.footericon &&
                                      (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                        ? es.footericon
                                        : client.user.displayAvatarURL()
                                    : null
                            )
                            .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-membercount"]["variable7"]), 4096))
                            .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                    ],
                });
                await tempmsg.channel
                    .awaitMessages({ filter: m => m.author.id == cmduser.id, max: 1, time: 90000, errors: ["time"] })
                    .then(async collected => {
                        var message = collected.first();
                        if (!message) return message.reply("NO SE ENVIÓ NINGÚN MENSAJE");
                        let channel =
                            message.mentions.channels.filter(ch => ch.guild.id == message.guild.id).first() ||
                            message.guild.channels.cache.get(message.content);
                        if (channel) {
                            var settts = client.setups.get(message.guild.id, `membercount`);
                            let name = client.setups.get(message.guild.id, channel.id, `membercount.message${SetupNumber}`);
                            let curmessage = name || channel.name;
                            client.setups.set(message.guild.id, channel.id, `membercount.channel${SetupNumber}`);
                            let temptype = SetupNumber;
                            message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-membercount"]["variable8"]), 256))
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setDescription(obeyUi.limit(`Current Name: \`${curmessage}\``.substring(0, 2048), 4096))
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });

                            tempmsg = await message.reply({
                                embeds: [
                                    new Discord.EmbedBuilder()
                                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-membercount"]["variable9"]), 256))
                                        .setColor(es.color)
                                        .setThumbnail(
                                            es.thumb
                                                ? es.footericon &&
                                                  (es.footericon.includes("http://") || es.footericon.includes("https://"))
                                                    ? es.footericon
                                                    : client.user.displayAvatarURL()
                                                : null
                                        )
                                        .setDescription(
                                            obeyUi.limit(`Current Name: \`${curmessage}\`

*Send the Name NOW!, mind that the Name must be shorter then 32 Characters!!!*`, 4096)
                                        )
                                        .addFields({ name: `**USER KEYWORDS** (USERS __including__ Bots):`, value: `> \`{user}\` / \`{users}\` will be replaced with the amount of all users, no matter if bot or not

> \`{online}\` will be replaced with the amount of **ONLINE** USERS
> \`{idle}\` will be replaced with the amount of **IDLE** USERS
> \`{dnd}\` will be replaced with the amount of **DND** USERS
> \`{offline}\` will be replaced with the amount of **OFFLINE** USERS
> \`{allonline}\` will be replaced with the amount of **ONLINE**+**IDLE**+**DND** USERS  ` })
                                        .addFields({ name: `**MEMBER KEYWORDS** (Members __without__ Bots):`, value: `> \`{member}\` / \`{members}\` will be replaced with the amount of all Members (Humans)

> \`{onlinemember}\` will be replaced with the amount of **ONLINE** MEMBERS
> \`{idlemember}\` will be replaced with the amount of **IDLE** MEMBERS
> \`{dndmember}\` will be replaced with the amount of **DND** MEMBERS
> \`{offlinemember}\` will be replaced with the amount of **OFFLINE** MEMBERS
> \`{allonlinemember}\` will be replaced with the amount of **ONLINE**+**IDLE**+**DND** MEMBERS (no Bots)  ` })
                                        .addFields({ name: `**OTHER KEYWORDS:**`, value: `> \`{bot}\` / \`{bots}\` will be replaced with the amount of all bots
> \`{channel}\` / \`{channels}\` will be replaced with the amount of all Channels
> \`{text}\` / \`{texts}\` will be replaced with the amount of Text Channels
> \`{voice}\` / \`{voices}\` will be replaced with the amount of Voice Channels
> \`{stage}\` / \`{stages}\` will be replaced with the amount of Stage Channels
> \`{thread}\` / \`{threads}\` will be replaced with the amount of Threads
> \`{news}\` will be replaced with the amount of News Channels
> \`{category}\` / \`{parent}\` will be replaced with the amount of Categories / Parents
> \`{openthread}\` / \`{openthreads}\` will be replaced with the amount of open Threads
> \`{archivedthread}\` / \`{archivedthreads}\` will be replaced with the amount of archived Threads

> \`{role}\` / \`{roles}\` will be replaced with the amount of Roles` })
                                        .addFields({ name: `**Examples:**`, value: `> \`${obeyUi.markup("icon.conversation")} Members: {members}\`
> \`${obeyUi.markup("icon.conversation")} Roles: {roles}\`
> \`${obeyUi.markup("icon.conversation")} Channels: {channels}\`
> \`${obeyUi.markup("icon.conversation")} Bots: {bots} \`
> \`${obeyUi.markup("icon.conversation")} All Users: {users}\`` })
                                        .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                ],
                            });
                            await tempmsg.channel
                                .awaitMessages({
                                    filter: m => m.author.id == cmduser.id,
                                    max: 1,
                                    time: 90000,
                                    errors: ["time"],
                                })
                                .then(async collected => {
                                    var message = collected.first();
                                    if (!message) throw "NO SE ENVIÓ NINGÚN MENSAJE";
                                    let name = message.content;
                                    if (name && name.length <= 32) {
                                        let guild = message.guild;
                                        client.setups.set(message.guild.id, name, `membercount.message${SetupNumber}`);
                                        channel.setName(
                                            String(name)
                                                .replace(/{user}/i, guild.memberCount)
                                                .replace(/{users}/i, guild.memberCount)

                                                .replace(
                                                    /{member}/i,
                                                    guild.members.cache.filter(member => !member.user.bot).size
                                                )
                                                .replace(
                                                    /{members}/i,
                                                    guild.members.cache.filter(member => !member.user.bot).size
                                                )

                                                .replace(
                                                    /{bots}/i,
                                                    guild.members.cache.filter(member => member.user.bot).size
                                                )
                                                .replace(
                                                    /{bot}/i,
                                                    guild.members.cache.filter(member => member.user.bot).size
                                                )

                                                .replace(
                                                    /{online}/i,
                                                    guild.members.cache.filter(
                                                        member =>
                                                            !member.user.bot &&
                                                            member.presence &&
                                                            member.presence.status == "online"
                                                    ).size
                                                )
                                                .replace(
                                                    /{offline}/i,
                                                    guild.members.cache.filter(
                                                        member => !!member.user.bot && member.presence
                                                    ).size
                                                )
                                                .replace(
                                                    /{idle}/i,
                                                    guild.members.cache.filter(
                                                        member =>
                                                            !member.user.bot &&
                                                            member.presence &&
                                                            member.presence.status == "idle"
                                                    ).size
                                                )
                                                .replace(
                                                    /{dnd}/i,
                                                    guild.members.cache.filter(
                                                        member =>
                                                            !member.user.bot &&
                                                            member.presence &&
                                                            member.presence.status == "dnd"
                                                    ).size
                                                )
                                                .replace(
                                                    /{allonline}/i,
                                                    guild.members.cache.filter(member => !member.user.bot && member.presence)
                                                        .size
                                                )

                                                .replace(
                                                    /{onlinemember}/i,
                                                    guild.members.cache.filter(
                                                        member =>
                                                            member.user.bot &&
                                                            member.presence &&
                                                            member.presence.status == "online"
                                                    ).size
                                                )
                                                .replace(
                                                    /{offlinemember}/i,
                                                    guild.members.cache.filter(member => !member.presence).size
                                                )
                                                .replace(
                                                    /{idlemember}/i,
                                                    guild.members.cache.filter(
                                                        member => member.presence && member.presence.status == "idle"
                                                    ).size
                                                )
                                                .replace(
                                                    /{dndmember}/i,
                                                    guild.members.cache.filter(
                                                        member => member.presence && member.presence.status == "dnd"
                                                    ).size
                                                )
                                                .replace(
                                                    /{allonlinemember}/i,
                                                    guild.members.cache.filter(member => member.presence).size
                                                )

                                                .replace(/{role}/i, guild.roles.cache.size)
                                                .replace(/{roles}/i, guild.roles.cache.size)

                                                .replace(/{channel}/i, guild.channels.cache.size)
                                                .replace(/{channels}/i, guild.channels.cache.size)

                                                .replace(
                                                    /{text}/i,
                                                    guild.channels.cache.filter(ch => ch.type == ChannelType.GuildText).size
                                                )
                                                .replace(
                                                    /{voice}/i,
                                                    guild.channels.cache.filter(ch => ch.type == ChannelType.GuildVoice).size
                                                )
                                                .replace(
                                                    /{stage}/i,
                                                    guild.channels.cache.filter(ch => ch.type == ChannelType.GuildStageVoice).size
                                                )
                                                .replace(
                                                    /{thread}/i,
                                                    guild.channels.cache.filter(ch => ch.type == "THREAD").size
                                                )
                                                .replace(
                                                    /{news}/i,
                                                    guild.channels.cache.filter(ch => ch.type == ChannelType.GuildAnnouncement).size
                                                )
                                                .replace(
                                                    /{category}/i,
                                                    guild.channels.cache.filter(ch => ch.type == ChannelType.GuildCategory).size
                                                )
                                                .replace(
                                                    /{openthread}/i,
                                                    guild.channels.cache.filter(
                                                        ch => ch.isThread() && !ch.archived
                                                    ).size
                                                )
                                                .replace(
                                                    /{archivedthread}/i,
                                                    guild.channels.cache.filter(
                                                        ch => ch.isThread() && ch.archived
                                                    ).size
                                                )

                                                .replace(
                                                    /{texts}/i,
                                                    guild.channels.cache.filter(ch => ch.type == ChannelType.GuildText).size
                                                )
                                                .replace(
                                                    /{voices}/i,
                                                    guild.channels.cache.filter(ch => ch.type == ChannelType.GuildVoice).size
                                                )
                                                .replace(
                                                    /{stages}/i,
                                                    guild.channels.cache.filter(ch => ch.type == ChannelType.GuildStageVoice).size
                                                )
                                                .replace(
                                                    /{threads}/i,
                                                    guild.channels.cache.filter(ch => ch.type == "THREAD").size
                                                )
                                                .replace(
                                                    /{parent}/i,
                                                    guild.channels.cache.filter(ch => ch.type == ChannelType.GuildCategory).size
                                                )
                                                .replace(
                                                    /{openthreads}/i,
                                                    guild.channels.cache.filter(
                                                        ch => ch.isThread() && !ch.archived
                                                    ).size
                                                )
                                                .replace(
                                                    /{archivedthreads}/i,
                                                    guild.channels.cache.filter(
                                                        ch => ch.isThread() && ch.archived
                                                    ).size
                                                )
                                        );
                                        return message.reply({
                                            embeds: [
                                                new Discord.EmbedBuilder()
                                                    .setTitle(
                                                        obeyUi.limit(eval(
                                                            client.la[ls]["cmds"]["setup"]["setup-membercount"]["variable10"]
                                                        ), 256)
                                                    )
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
                                                    .setDescription(
                                                        obeyUi.limit(`Example: \`${String(name)
                                                            .replace(/{user}/i, guild.memberCount)
                                                            .replace(/{users}/i, guild.memberCount)

                                                            .replace(
                                                                /{member}/i,
                                                                guild.members.cache.filter(member => !member.user.bot).size
                                                            )
                                                            .replace(
                                                                /{members}/i,
                                                                guild.members.cache.filter(member => !member.user.bot).size
                                                            )

                                                            .replace(
                                                                /{bots}/i,
                                                                guild.members.cache.filter(member => member.user.bot).size
                                                            )
                                                            .replace(
                                                                /{bot}/i,
                                                                guild.members.cache.filter(member => member.user.bot).size
                                                            )

                                                            .replace(
                                                                /{online}/i,
                                                                guild.members.cache.filter(
                                                                    member =>
                                                                        !member.user.bot &&
                                                                        member.presence &&
                                                                        member.presence.status == "online"
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{offline}/i,
                                                                guild.members.cache.filter(
                                                                    member => !!member.user.bot && member.presence
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{idle}/i,
                                                                guild.members.cache.filter(
                                                                    member =>
                                                                        !member.user.bot &&
                                                                        member.presence &&
                                                                        member.presence.status == "idle"
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{dnd}/i,
                                                                guild.members.cache.filter(
                                                                    member =>
                                                                        !member.user.bot &&
                                                                        member.presence &&
                                                                        member.presence.status == "dnd"
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{allonline}/i,
                                                                guild.members.cache.filter(
                                                                    member => !member.user.bot && member.presence
                                                                ).size
                                                            )

                                                            .replace(
                                                                /{onlinemember}/i,
                                                                guild.members.cache.filter(
                                                                    member =>
                                                                        member.user.bot &&
                                                                        member.presence &&
                                                                        member.presence.status == "online"
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{offlinemember}/i,
                                                                guild.members.cache.filter(member => !member.presence).size
                                                            )
                                                            .replace(
                                                                /{idlemember}/i,
                                                                guild.members.cache.filter(
                                                                    member =>
                                                                        member.presence && member.presence.status == "idle"
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{dndmember}/i,
                                                                guild.members.cache.filter(
                                                                    member =>
                                                                        member.presence && member.presence.status == "dnd"
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{allonlinemember}/i,
                                                                guild.members.cache.filter(member => member.presence).size
                                                            )

                                                            .replace(/{role}/i, guild.roles.cache.size)
                                                            .replace(/{roles}/i, guild.roles.cache.size)

                                                            .replace(/{channel}/i, guild.channels.cache.size)
                                                            .replace(/{channels}/i, guild.channels.cache.size)

                                                            .replace(
                                                                /{text}/i,
                                                                guild.channels.cache.filter(ch => ch.type == ChannelType.GuildText)
                                                                    .size
                                                            )
                                                            .replace(
                                                                /{voice}/i,
                                                                guild.channels.cache.filter(ch => ch.type == ChannelType.GuildVoice)
                                                                    .size
                                                            )
                                                            .replace(
                                                                /{stage}/i,
                                                                guild.channels.cache.filter(
                                                                    ch => ch.type == ChannelType.GuildStageVoice
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{thread}/i,
                                                                guild.channels.cache.filter(ch => ch.type == "THREAD").size
                                                            )
                                                            .replace(
                                                                /{news}/i,
                                                                guild.channels.cache.filter(ch => ch.type == ChannelType.GuildAnnouncement)
                                                                    .size
                                                            )
                                                            .replace(
                                                                /{category}/i,
                                                                guild.channels.cache.filter(
                                                                    ch => ch.type == ChannelType.GuildCategory
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{openthread}/i,
                                                                guild.channels.cache.filter(
                                                                    ch => ch.isThread() && !ch.archived
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{archivedthread}/i,
                                                                guild.channels.cache.filter(
                                                                    ch => ch.isThread() && ch.archived
                                                                ).size
                                                            )

                                                            .replace(
                                                                /{texts}/i,
                                                                guild.channels.cache.filter(ch => ch.type == ChannelType.GuildText)
                                                                    .size
                                                            )
                                                            .replace(
                                                                /{voices}/i,
                                                                guild.channels.cache.filter(ch => ch.type == ChannelType.GuildVoice)
                                                                    .size
                                                            )
                                                            .replace(
                                                                /{stages}/i,
                                                                guild.channels.cache.filter(
                                                                    ch => ch.type == ChannelType.GuildStageVoice
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{threads}/i,
                                                                guild.channels.cache.filter(ch => ch.type == "THREAD").size
                                                            )
                                                            .replace(
                                                                /{parent}/i,
                                                                guild.channels.cache.filter(
                                                                    ch => ch.type == ChannelType.GuildCategory
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{openthreads}/i,
                                                                guild.channels.cache.filter(
                                                                    ch => ch.isThread() && !ch.archived
                                                                ).size
                                                            )
                                                            .replace(
                                                                /{archivedthreads}/i,
                                                                guild.channels.cache.filter(
                                                                    ch => ch.isThread() && ch.archived
                                                                ).size
                                                            )}\`

**Checking all Channels every 60 Minutes:**
> **Delay between each channel:** \`5.1 Minutes\` (Only if a Change is needed)
> **Optimal Member-Count Channels:** \`6 or less\``.substring(0, 2048), 4096)
                                                    )
                                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                            ],
                                        });
                                    }
                                    message.reply("No Name added, or the Name is too long!");
                                })
                                .catch(e => {
                                    console.log(String(e).grey);
                                    return message.reply({
                                        embeds: [
                                            new Discord.EmbedBuilder()
                                                .setTitle(
                                                    obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-membercount"]["variable11"]), 256)
                                                )
                                                .setColor(es.wrongcolor)
                                                .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                                .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                                        ],
                                    });
                                });
                        } else {
                            message.reply("NO SE MENCIONÓ NINGÚN CANAL / NO ID ADDED");
                        }
                    })
                    .catch(e => {
                        console.log(e.stack ? String(e.stack).grey : String(e).grey);
                        return message.reply({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-membercount"]["variable12"]), 256))
                                    .setColor(es.wrongcolor)
                                    .setDescription(obeyUi.limit(`¡Operación Cancelada!`.substring(0, 2000), 4096))
                                    .setFooter(obeyMeta.asFooter(client.getFooter(es))),
                            ],
                        });
                    });
            }
        } catch (e) {
            console.log(String(e.stack).grey.bgRed);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["setup"]["setup-membercount"]["variable15"]), 256))
                        .setDescription(obeyUi.limit(`\`\`\`${String(JSON.stringify(e)).substring(0, 2000)}\`\`\``, 4096)),
                ],
            });
        }
    },
};
/**
 * @INFO
 * Bot Coded by Melodia | https://github?.com/melodiabl/discord-js-lavalink-Music-Bot-erela-js
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 * Desarrollado por Melodia | https://github.com/melodiabl
 * @INFO
 */
