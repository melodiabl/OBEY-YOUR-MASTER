const {runProjectInfo}=require('../../handlers/project/info')
module.exports = {
    name: "ownergithub",
    category: "Info",
    aliases: ["ownergit", "source", "sourcecode", "src"],
    cooldown: 2,
    usage: "ownergithub",
    description: "Shows you the Github and Source Code Information about this Bot",
    type: "bot",
    run: async (client, message) => runProjectInfo(client, message, 'github'),
}
