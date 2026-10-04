function renderWelcomeMessage(template, user, guild) {
  const values = {
    user: String(user), username: user.username, usertag: user.username,
    guild: guild.name, server: guild.name, count: String(guild.memberCount ?? ''),
  }
  // Replace in one pass so member/server names never become template instructions.
  return String(template).replace(/\{(user|username|usertag|guild|server|count)\}/g,
    (_, key) => values[key] ?? '')
}

module.exports = { renderWelcomeMessage }
