module.exports = {
  name: 'profile',
  author: 'JARiF',
  version: '1.0',
  description: 'Get profile picture of yourself, replied user or mentioned user',
  usage: 'profile [mention or reply]',
  aliases: ['pfp'],
  role: 1,
  category: 'UTILITY',
  noPrefix: false,

  async zayn({ sock, msg }) {
    try {
      let userId;

      const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

      if (contextInfo?.mentionedJid?.length > 0) {
        userId = contextInfo.mentionedJid[0];
      } else if (contextInfo?.participant) {
        userId = contextInfo.participant;
      } else {
        userId = msg.key.participant || msg.key.remoteJid;
      }

      const ppUrl = await sock.profilePictureUrl(userId, 'image').catch(() => null);

      if (!ppUrl) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '⚠️ Profile picture not found or user has no profile photo.'
        });
      }

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: ppUrl },
        caption: `🖼️ Profile picture of @${userId.split('@')[0]}`,
        contextInfo: { mentionedJid: [userId] }
      });
    } catch (err) {
      console.error('❌ Error in profile command:', err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Failed to get profile picture.'
      });
    }
  }
};
