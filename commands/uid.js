module.exports = {
  name: 'uid',
  description: 'Get full WhatsApp UID and phone number of sender, mentioned user, replied user, or given number.',
  usage: '!uid [number]',
  aliases: ['u'],
  role: 0,
  version: '1.1',
  author: 'JARiF',
  category: 'UTILITY',
  noPrefix: false,

  zayn: async ({ sock, msg, sender, args }) => {
    try {
      let targetId;

      if (args.length > 0) {
        const raw = args[0].replace(/\D/g, '');

        if (args[0].includes('@')) {
          targetId = args[0];
        } else {
          targetId = raw + '@s.whatsapp.net';
        }

      } else {
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        const quoted = contextInfo?.participant;
        const mentions = contextInfo?.mentionedJid;

        if (quoted) {
          targetId = quoted;
        } else if (mentions && mentions.length > 0) {
          targetId = mentions[0];
        } else {
          targetId = msg.key.participant || msg.key.remoteJid;
        }
      }

      if (!targetId) throw new Error('Could not determine target user.');

      let displayId;
      if (targetId.endsWith('@s.whatsapp.net')) {
        displayId = targetId;
      } else if (targetId.endsWith('@lid')) {
        displayId = targetId; 
      } else {
        displayId = targetId;
      }


      const messageText = `🆔: ${displayId}`;

      await sock.sendMessage(msg.key.remoteJid, {
        text: messageText,
        mentions: [targetId],
      });

    } catch (error) {
      console.error(error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Could not retrieve user ID.',
      });
    }
  }
};
