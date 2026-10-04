module.exports = client => ({
  id: 'music',
  version: '1.0.0',
  defaults: { volume: 100, loop: 'none', autoplay: false, filter: 'none' },
  permissions: {
    read: 'guild-admin-web; existing member/voice checks in Discord',
    control: 'same-voice-channel; djroles/djonlycmds/requestonlycmds',
    configure: 'ManageGuild',
  },
  commands: {
    slash: (client.allCommands?.find(command => command.name === 'music')?.options || [])
      .map(option => `music.${option.name}`),
    prefix: [...(client.commands?.values?.() || [])]
      .filter(command => command.category?.toLowerCase().includes('music')).map(command => command.name),
  },
  interactions: ['mp_shuffle', 'mp_prev', 'mp_toggle', 'mp_skip', 'mp_loop', 'mp_lyrics',
    'mp_voldown', 'mp_stop', 'mp_volup', 'mp_queue', 'mp_like', 'mp_autoplay'],
  events: {
    consumed: ['interactionCreate', 'dbReady'],
    emitted: ['playerStateUpdate'],
  },
  jobs: [], // Session checkpoint timers exist; no durable worker is implemented.
  api: ['GET /api/player/:guildId', 'POST /api/player/:guildId/action',
    'POST /api/player/:guildId/add', 'POST /api/player/:guildId/search',
    'GET /api/music/status/:guildId'],
  realtime: { emitted: ['player:state', 'player:tick'], consumed: ['join', 'leave'] },
  dependencies: ['shoukaku', 'mongoose', 'socket.io'],
  capabilities: {
    playback: client.music ? 'available' : 'unavailable',
    guildToggle: 'pending',
    lyricsRealtime: 'pending',
    durableJobs: 'unavailable',
  },
})
