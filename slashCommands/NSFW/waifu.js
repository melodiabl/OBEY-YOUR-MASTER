const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
const booru = require("booru");
module.exports = {
    name: "waifu",
    description: "Obtén un hentai temático de waifu",
    options: [
        //{"Integer": { name: "ping_amount", description: "How many times do you want to ping?", required: true }}, //to use in the code: interacton.getInteger("ping_amount")
        //{"String": { name: "ping_amount", description: "How many times do you want to ping?", required: true }}, //to use in the code: interacton.getString("ping_amount")
        //{"User": { name: "which_user", description: "From Which Usuario do you want to get the Avatar?", required: false }}, //to use in the code: interacton.getUser("ping_a_user")
        //{"Channel": { name: "what_channel", description: "To Ping a Canal lol", required: false }}, //to use in the code: interacton.getChannel("what_channel")
        //{"Role": { name: "what_role", description: "To Ping a Rol lol", required: false }}, //to use in the code: interacton.getRole("what_role")
        //{"IntChoices": { name: "what_ping", description: "What Ping do you want to get?", required: true, choices: [["Bot", 1], ["Discord Api", 2]] }, //here the second array input MUST BE A NUMBER // TO USE IN THE CODE: interacton.getInteger("what_ping")
        //{"StringChoices": { name: "what_ping", description: "What Ping do you want to get?", required: true, choices: [["Bot", "botping"], ["Discord Api", "api"]] }}, //here the second array input MUST BE A STRING // TO USE IN THE CODE: interacton.getString("what_ping")
    ],
    run: async (client, interaction, cmduser, es, ls, prefix, player, message) => {
        if (!client.settings.get(message.guild.id, "NSFW")) {
            const x = new EmbedBuilder()
                .setColor(es.wrongcolor)
                .setFooter(client.getFooter(es))
.setTitle(client.la[ls].common.disabled.title)
                .setDescription(
                    require(`${process.cwd()}/handlers/functions`).handlemsg(client.la[ls].common.disabled.description, {
                        prefix: prefix,
                    })
                );
            return interaction?.reply({ embeds: [x], ephemeral: true });
        }

        //////////if (!message.channel.nsfw) return interaction?.reply({content:eval(client.la[ls]["cmds"]["nsfw"]["2danal"]["variable1"]), empheral: true})

        try {
            const images = await booru.search("rule34", ["waifu"], {
                nsfw: true,
                limit: 1,
                random: true,
            });
            const image = booru.commonfy(images)[0];
            if (image) {
                interaction?.reply({ content: `${image.common.file_url}`, ephemeral: true });
            } else {
                interaction?.reply({ content: "No se encontró imagen de waifu", ephemeral: true });
            }
        } catch (err) {
            interaction?.reply({ content: "Error al buscar waifu", ephemeral: true });
        }
    },
};
