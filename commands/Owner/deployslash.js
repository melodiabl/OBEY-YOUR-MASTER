const { runSlashPublication } = require('../../handlers/slash-publication-command');
module.exports = {
    name: 'deployslash', type: 'info', category: 'Owner', aliases: ['deployslash', 'deploy', 'loadslash', 'deployslashcommands', 'deployslashcmds', 'loadslashcommands', 'loadslashcmds'],
    description: 'Preview and confirm slash command publication for an exact server or globally', usage: 'deployslash [GUILDID]', cooldown: 360,
    run: (client, message, args) => runSlashPublication(client, message, args),
};
