const {runProjectInfo}=require('../../handlers/project/info')
module.exports = {
    name: "support",
    category: "Info",
    usage: "invite",
    description: "Sends you the Support Servidor Link",
    type: "bot",
    run: async (client, message) => runProjectInfo(client, message, 'support'),
}
