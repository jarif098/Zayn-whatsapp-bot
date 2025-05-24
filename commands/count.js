module.exports = {
    name: 'count',
  author: 'JARiF',
  version: "1.0",
  description: 'Show message count for yourself or all group members',
  usage: '!count [all]',
  aliases: ['msgcount', 'messagecount'],
  role: 1,
  cooldown: 5,
  category: 'UTILITY',


  async execute({ sock, msg, args, userData }) {
    const groupId = msg.key.remoteJid;

    if (!groupId.endsWith('@g.us')) {
      return sock.sendMessage(groupId, { text: 'This command can only be used in groups.' }, { quoted: msg });
    }

    function getMsgCount(userJid) {
      const id = `${groupId}_${userJid}`;
      const user = userData.find(u => u.id === id);
      return user?.data?.msgCount || 0;
    }

    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'all':
        {
          const groupMeta = await sock.groupMetadata(groupId);
          const participants = groupMeta.participants || [];

          let text = `📊 Message counts for all group members:\n\n`;
          const mentions = [];

          const membersWithCounts = participants
            .map((p) => ({
              jid: p.id,
              count: getMsgCount(p.id),
            }))
            .sort((a, b) => b.count - a.count);

          for (const member of membersWithCounts) {
            const number = member.jid.split('@')[0];
            text += `@${number}: ${member.count} message${member.count === 1 ? '' : 's'}\n`;
            mentions.push(member.jid);
          }

          await sock.sendMessage(groupId, { text, mentions }, { quoted: msg });
        }
        break;

      default:
        {
          const senderJid = msg.key.participant || msg.key.remoteJid;
          const count = getMsgCount(senderJid);

          await sock.sendMessage(
            groupId,
            {
              text: `You have sent ${count} message${count === 1 ? '' : 's'} in this group.`,
            },
            { quoted: msg }
          );
        }
        break;
    }
  },
};
