module.exports = {
  name: 'tagall',
  version: "1.0",
  author: "JARiF",
  aliases: ['mentionall', 'everyone'],
  role: 1, 
  description: 'Mention all group members (admin only)',
  category: 'GROUP',

  async zayn({ sock, msg, args, sender }) {
    const groupId = msg.key.remoteJid;

    if (!groupId.endsWith('@g.us')) {
      return await sock.sendMessage(groupId, { text: '❌ This command can only be used in group chats.' });
    }

    const metadata = await sock.groupMetadata(groupId);
    const participants = metadata.participants;

    const isAdmin = participants.find(p => p.id === sender)?.admin;
    if (!isAdmin) {
      return await sock.sendMessage(groupId, { text: '❌ Only group admins can use this command.' });
    }

    const mentions = participants.map(p => p.id);
    const message = args.join(" ") || "👥 Mentioning everyone:";
    const mentionText = `${message}\n\n` + mentions.map(u => `@${u.split('@')[0]}`).join(' ');

    await sock.sendMessage(groupId, {
      text: mentionText,
      mentions
    });
  }
};
