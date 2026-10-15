const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require("discord.js");
const { allEmojis } = require("../../botconfig/emojiFunctions");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);
const emoji = require(`${process.cwd()}/handlers/assets/legacy-config`);
const { parseMilliseconds, duration, GetUser, nFormatter, ensure_economy_user } = require(
    `${process.cwd()}/handlers/functions`
);
module.exports = {
    name: "storeinfo",
    category: "Economy",
    aliases: ["store", "shop"],
    description: "Shows the Store",
    usage: "storeinfo",
    type: "info",
    run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");
        let ls = client.settings.get(message.guild.id, "language");
        if (!client.settings.get(message.guild.id, "ECONOMY")) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(es.wrongcolor)
                        .setFooter(obeyMeta.asFooter(client.getFooter(es)))
                        .setTitle(obeyUi.limit(client.la[ls].common.disabled.title, 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["economy"]["storeinfo"]["variable1"]), 4096)),
                ],
            });
        }
        try {
            //command
            var user = message.author;
            if (user.bot) return message.reply(eval(client.la[ls]["cmds"]["economy"]["storeinfo"]["variable2"]));

            //ensure the economy data
            ensure_economy_user(client, message.guild.id, user.id);
            const data = client.economy.get(`${message.guild.id}-${user.id}`);
            var items = 0;
            var itemsvalue = 0;
            for (const itemarray in data.items) {
                items += data.items[`${itemarray}`];
                var prize = 0;
                switch (itemarray.toLowerCase()) {
                    case "yacht":
                        prize = 75000;
                        break;
                    case "lamborghini":
                        prize = 50000;
                        break;
                    case "car":
                        prize = 6400;
                        break;
                    case "motorbike":
                        prize = 1500;
                        break;
                    case "bicycle":
                        prize = 500;
                        break;

                    case "nike":
                        prize = 300;
                        break;
                    case "tshirt":
                        prize = 60;
                        break;

                    case "mansion":
                        prize = 45000;
                        break;
                    case "house":
                        prize = 8000;
                        break;
                    case "dirthut":
                        prize = 150;
                        break;

                    case "pensil":
                        prize = 20;
                        break;
                    case "pen":
                        prize = 10;
                        break;
                    case "condom":
                        prize = 30;
                        break;
                    case "bottle":
                        prize = 50;
                        break;

                    case "fish":
                        prize = 1000;
                        break;
                    case "hamster":
                        prize = 1500;
                        break;
                    case "dog":
                        prize = 2000;
                        break;
                    case "cat":
                        prize = 2000;
                        break;
                }
                itemsvalue += prize * data.items[`${itemarray}`];
            }
            const p2b = costs => (Number(costs) > Number(data.balance) ? allEmojis.msg.ERROR : allEmojis.msg.SUCCESS);
            //return some message!
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
                        .setFooter(obeyMeta.asFooter({ text: user.username + obeyUi.owned(" | ❌ .. Unable to buy | ✅ ... Possible to buy"),
                            iconURL: user.displayAvatarURL()
                        }))
                        .setTitle(obeyUi.limit(eval(client.la[ls]["cmds"]["economy"]["storeinfo"]["variable3"]), 256))
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["economy"]["storeinfo"]["variable4"]), 4096))
                        .addFields({ name: obeyUi.owned("✏️ Useables"), value: ">>> " +
                                `${obeyUi.markup("icon.edit")} **\`Pensil [10 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(10)}
${obeyUi.markup("icon.edit")} **\`Pen [20 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(20)}
${obeyUi.markup("icon.piece-purple")} **\`Condom [30 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(30)}
${obeyUi.markup("icon.baby")} **\`Bottle [50 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(50)}` })
                        .addFields({ name: obeyUi.owned("👕 Clothes"), value: ">>> " +
                                `${obeyUi.markup("icon.shoe")} **\`Nike Shoe [300 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(300)}
${obeyUi.markup("icon.shirt")} **\`T-Shirt [60 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(60)}` })
                        .addFields({ name: obeyUi.owned("🐕 Animals"), value: ">>> " +
                                `${obeyUi.markup("icon.fish")}\`Fish [1000 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(1000)}
${obeyUi.markup("icon.hamster")} **\`Hamster [1500 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(1500)}
${obeyUi.markup("icon.dog")} **\`Dog [2000 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(2000)}
${obeyUi.markup("icon.cat")} **\`Cat [2000 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(2000)}` })
                        .addFields({ name: obeyUi.owned("🚗 Means of Transport"), value: ">>> " +
                                `${obeyUi.markup("icon.boat")}\`Yacht [75000 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(75000)}
${obeyUi.markup("icon.car")} **\`Lamborghini [50000 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(50000)}
${obeyUi.markup("icon.car")} **\`Car [6400 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(6400)}
${obeyUi.markup("icon.car")} **\`Motorbike [1500 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(1500)}
${obeyUi.markup("icon.bike")} **\`Bicycle [500 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(500)}` })
                        .addFields({ name: obeyUi.owned("🏠 Livingarea"), value: ">>> " +
                                `${obeyUi.markup("icon.home")} **\`Mansion [45000 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(45000)}
${obeyUi.markup("icon.home")} **\`House [8000 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(8000)}
${obeyUi.markup("icon.game-empty")} **\`Dirthut [150 ${obeyUi.markup("icon.wallet")}]\`** | ${p2b(150)}` }),
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
                        .setDescription(obeyUi.limit(eval(client.la[ls]["cmds"]["economy"]["storeinfo"]["variable5"]), 4096)),
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
