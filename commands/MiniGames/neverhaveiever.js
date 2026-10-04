const { NeverHaveIEver } = require('../../handlers/games')
const { EmbedBuilder } = require("discord.js");
const config = require(`${process.cwd()}/botconfig/config.json`);
var ee = require(`${process.cwd()}/botconfig/embed.json`);

module.exports = {
    name: "neverhaveiever",
    category: "MiniGames",
    description: "Plays a Game",
    aliases: ["neverever"],
    usage: "neverhaveiever --> Play the Game",
    type: "buttons",
     run: async (client, message, args, cmduser, text, prefix) => {
        let es = client.settings.get(message.guild.id, "embed");let ls = client.settings.get(message.guild.id, "language")
        if(!client.settings.get(message.guild.id, "MINIGAMES")){
          return message.reply({ embeds: [new EmbedBuilder()
            .setColor(es.wrongcolor)
            .setFooter(client.getFooter(es))
            .setTitle(client.la[ls].common.disabled.title)
            .setDescription(require(`${process.cwd()}/handlers/functions`).handlemsg(client.la[ls].common.disabled.description, {prefix: prefix}))] }
          );
        }
        await NeverHaveIEver({
          message: message,
          embed: {
            title: 'Never Have I Ever',
            color: es.color,
            footer: es.footertext,
            timestamp: true,
          },
          thinkMessage: 'I am thinking',
          othersMessage: 'Only <@{{author}}> can use the buttons!',
          buttons: { optionA: 'Yes', optionB: 'No' },
        });

    }
  }
