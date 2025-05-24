module.exports = {
  name: 'closegroup',
  author: 'JARiF',
  version: "1.0",
  aliases: ['close'],
  role: 1,
  description: 'Closes the group so only admins can send messages',
  category: 'GROUP',

   zayn: async function ({ message, sender, sock }) {
    const groupId = message.key.remoteJid;

    if (!groupId.endsWith('@g.us')) {
      return await message.reply('❌ This command can only be used in groups.');
    }

    const metadata = await sock.groupMetadata(groupId);
    const isAdmin = metadata.participants.some(
      p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
    );

    if (!isAdmin) {
      return await message.reply('❌ You must be a group admin to use this command.');
    }

    try {
      await sock.groupSettingUpdate(groupId, 'announcement');
      await message.reply('✅ Group has been closed. Only admins can send messages now.');
    } catch (err) {
      console.error('Failed to close group:', err);
      await message.reply('❌ Failed to close group. Please try again later.');
    }
  }
};
