module.exports = {
  name: 'opengroup',
  author: "JARiF",
  version: "1.0",
  aliases: ['open'],
  role: 2, 
  description: 'Opens the group so everyone can send messages',
  category: 'GROUP',
  
  async zayn({ sock, msg, sender }) {
    const groupId = msg.key.remoteJid;

    if (!groupId.endsWith('@g.us')) {
      return await sock.sendMessage(groupId, { text: '❌ This command can only be used in groups.' });
    }

    const metadata = await sock.groupMetadata(groupId);
    const isAdmin = metadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));

    if (!isAdmin) {
      return await sock.sendMessage(groupId, { text: '❌ You must be a group admin to use this command.' });
    }

    try {
      await sock.groupSettingUpdate(groupId, 'not_announcement');
      await sock.sendMessage(groupId, { text: '✅ Group has been opened. Everyone can send messages now.' });
    } catch (err) {
      console.error('Failed to open group:', err);
      await sock.sendMessage(groupId, { text: '❌ Failed to open group. Please try again later.' });
    }
  }
};
