function getPhoneNumberFromMsg(msg) {
  if (!msg) return null;

  const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

  const targetId = quoted || (mentions?.length > 0 ? mentions[0] : msg.key.participant || msg.key.remoteJid);
  return targetId || null;
}

module.exports = {
  name: 'daily',
  author: "JARiF",
  version: "1.0",
  role: 1,
  description: 'Claim your daily money (100-500 BDT)',
  category: "GAMES",
  noPrefix: false,

  zayn: async ({ message, userMoney, SaveData }) => {
    try {
      const userId = getPhoneNumberFromMsg(message);
      if (!userId) {
        return await message.reply('❌ Could not determine your phone number!');
      }

      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      let user = userMoney.find(u => u.id === userId);
      if (!user) {
        user = { id: userId, money: 0, lastClaim: 0 };
        userMoney.push(user);
      }

      if (now - user.lastClaim < oneDay) {
        const waitTime = oneDay - (now - user.lastClaim);
        const hours = Math.floor(waitTime / (1000 * 60 * 60));
        const minutes = Math.floor((waitTime % (1000 * 60 * 60)) / (1000 * 60));
        return await message.reply(`⏳ You already claimed your daily reward.\nTry again in ${hours}h ${minutes}m.`);
      }

      const reward = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
      user.money += reward;
      user.lastClaim = now;

      await SaveData('userMoney');

      await message.reply(`💰 You claimed ${reward} BDT!\nYour total balance: ${user.money} BDT`);
    } catch (err) {
      console.error('❌ Error in daily command:', err);
      await message.reply('❌ Something went wrong. Please try again later.');
    }
  }
};
