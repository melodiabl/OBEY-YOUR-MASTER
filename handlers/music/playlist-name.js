function exactPlaylistName(name) {
  const escaped = name.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  return { $regex: new RegExp('^' + escaped + '$', 'i') }
}

module.exports = { exactPlaylistName }
