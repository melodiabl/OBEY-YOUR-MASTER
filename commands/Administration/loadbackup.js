const { runBackupRestore } = require('../../handlers/backup-restore-command')
module.exports = {
  name: 'loadbackup', aliases: ['load-backup', 'lbackup', 'backupload'], category: 'Administration',
  description: 'Restaurar una copia con confirmación del propietario de ambos servidores',
  usage: 'loadbackup <serverId> <backupid>', type: 'server', cooldown: 120,
  run: (client, message, args) => runBackupRestore(client, message, args)
}
