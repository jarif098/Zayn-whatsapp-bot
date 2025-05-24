module.exports = {
  name: "leave",
  author: "JARiF",
  version: "1.0",
  aliases: ["leavegroup", "exit"],
  role: 0, 
  description: "Make the bot leave the group.",
  category: "GROUP",

  async zayn({ sock, msg, args }) {
    const groupId = msg.key.remoteJid;

    if (!groupId.endsWith("@g.us")) {
      return sock.sendMessage(groupId, { text: "❗ This command can only be used in groups." }, { quoted: msg });
    }

    try {
      await sock.groupLeave(groupId);
    } catch (error) {
      console.error("Failed to leave group:", error);
      await sock.sendMessage(groupId, { text: "⚠️ Failed to leave the group." }, { quoted: msg });
    }
  }
};
