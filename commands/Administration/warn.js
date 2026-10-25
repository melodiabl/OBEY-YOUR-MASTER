const { runPrefixWarn } = require('../../src/modules/moderation')

module.exports = {
    name: 'warn',
    category: 'Administration',
    cooldown: 0.5,
    description: 'Warns a member with a reason',
    usage: 'warn @Usuario [Reason]',
    type: 'member',
    run: runPrefixWarn,
}
