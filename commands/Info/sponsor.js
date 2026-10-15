const {runProjectInfo}=require('../../handlers/project/info')
module.exports = {
    name: "sponsor",
    category: "Info",
    aliases: ["sponsors"],
    description: "Shows the sponsor of this BoT",
    usage: "sponsor",
    type: "bot",
    run: async (client, message) => runProjectInfo(client, message, 'sponsor'),
}
