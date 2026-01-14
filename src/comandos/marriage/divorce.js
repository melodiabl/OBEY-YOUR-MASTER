module.exports = {
  DESCRIPTION: 'Rompe tu matrimonio actual',
  ALIASES: [],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute(client, message) {
    const userData = await client.db.getUserData(message.author.id);
    if (!userData.partner) return message.reply('No estás casado.');
    const partnerId = userData.partner;
    const partnerData = await client.db.getUserData(partnerId);
    userData.partner = null;
    partnerData.partner = null;
    await userData.save();
    await partnerData.save();
    message.reply('Has terminado tu matrimonio.');
  },
};