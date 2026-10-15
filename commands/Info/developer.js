const {runProjectInfo}=require('../../handlers/project/info')
module.exports = {
    name: "developer",
    category: "Info",
    aliases: ["dev", "tomato"],
    description: "Shows Information about the Developer",
    usage: "developer",
    type: "bot",
    run: async (client, message) => runProjectInfo(client, message, 'developer'),
}
