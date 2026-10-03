const assert = require('node:assert/strict')
const test = require('node:test')
const Playlist = require('../database/schemas/PlaylistSchema')
const deleteCommand = require('../slashCommands/Playlist/delete')

test('playlist deletion treats the supplied name as literal text', async () => {
  const original = Playlist.findOneAndDelete
  let filter
  Playlist.findOneAndDelete = async query => {
    filter = query
    return null
  }

  try {
    for (const name of ['.*', '[', 'A+B', 'A\\B', '$']) {
      await deleteCommand.run(null, {
        user: { id: 'user-1' },
        options: { getString: () => name },
        deferReply: async () => {},
        editReply: async () => {},
      })
      assert.equal(filter.userId, 'user-1')
      assert.equal(filter.name.$regex.test(name), true)
      assert.equal(filter.name.$regex.test('My Music'), false)
    }
  } finally {
    Playlist.findOneAndDelete = original
  }
})
