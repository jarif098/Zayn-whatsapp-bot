module.exports = {
  name: 'respect',
  aliases: ['honor', 'makeadmin'],
  description: 'Promote the command sender to admin if bot is admin.',
  role: 3,
  author: 'JARiF',
  noPrefix: false,
  category: 'GROUP',

  async zayn({ sock, msg, sender, isGroup }) {
    const jid = msg.key.remoteJid;
    try {
      await sock.groupParticipantsUpdate(jid, [sender], 'promote');
      return await sock.sendMessage(jid, { text: `✅ RESPECT! You have been promoted to admin.` });
    } catch (e) {
      return await sock.sendMessage(jid, { text: '❌ Failed to promote you to admin. Make sure I have admin rights.' });
    }
  }
};
