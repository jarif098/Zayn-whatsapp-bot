module.exports = {
  name: "kick",
  author: "JARiF",
  version: "1.0",
  aliases: [],
  description: "Kick someone from the group by replying to their message.",
  role: 1,
  category: "GROUP",

zayn: async function ({ sock, msg }) {
  const groupId = msg.key.remoteJid;
  const isGroup = groupId.endsWith("@g.us");

  if (!isGroup) {
    return sock.sendMessage(groupId, { text: "❌ This command only works in groups." }, { quoted: msg });
  }

    const target = msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (!target) {
      return sock.sendMessage(groupId, { text: "⚠️ Please reply to the user's message you want to kick." }, { quoted: msg });
    }

    const metadata = await sock.groupMetadata(groupId);
    const participants = metadata.participants;

    const targetInfo = participants.find(p => p.id === target);
    if (!targetInfo) {
      return sock.sendMessage(groupId, { text: "❌ Couldn't find the user in this group." }, { quoted: msg });
    }

    const isTargetAdmin = targetInfo.admin === "admin" || targetInfo.admin === "superadmin";
    if (isTargetAdmin) {
      return sock.sendMessage(groupId, { text: "🚫 Can't kick a group admin." }, { quoted: msg });
    }

    if (target === sock.user.id) {
      return sock.sendMessage(groupId, { text: "❌ I won't kick myself." }, { quoted: msg });
    }

    try {
      await sock.groupParticipantsUpdate(groupId, [target], "remove");

      const username = target.split("@")[0];
      await sock.sendMessage(groupId, {
        text: `✅ @${username} has been kicked from the group.`,
        mentions: [target],
      }, { quoted: msg });
    } catch (err) {
      console.error("Kick error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to kick the user." }, { quoted: msg });
    }
  },
};
