module.exports = {
  name: "groupname",
  author: 'JARiF',
  version: "1.0",
  role: 0,
  description: "Change the group name (subject).",
  category: "GROUP",
  usage: "setname <new group name>",

zayn: async function ({ sock, message, args }) {
    const groupId = message.key.remoteJid;

    if (!groupId.endsWith("@g.us")) {
      return await message.reply("❌ This command can only be used in groups.", { quoted: message });
    }

    if (!args.length) {
      return await message.reply("❗ Usage: !setname <new group name>", { quoted: message });
    }

    const newName = args.join(" ").trim();

    try {
      await sock.groupUpdateSubject(groupId, newName);
      await message.reply(`✅ Group name changed to:\n*${newName}*`, { quoted: message });
    } catch (err) {
      console.error("Error changing group name:", err);
      await message.reply("❌ Failed to change group name. Make sure I have admin rights.", { quoted: message });
    }
  },
};
