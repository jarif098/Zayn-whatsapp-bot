const { setGroupSettings, getGroupSettings } = require("../thread");

module.exports = {
  name: "welcome",
  version: "1.0",
  author: "JARiF",
  aliases: [],
  role: 1,
  description: "Toggle welcome/leave messages in group.",
  category: "GROUP",

zayn: async function ({ sock, msg, args }) {
    const groupId = msg.key.remoteJid;
    const sub = args[0]?.toLowerCase();

    if (!["on", "off"].includes(sub)) {
      return sock.sendMessage(groupId, { text: "❗ Usage: `.welcome on` or `.welcome off`" }, { quoted: msg });
    }

    const status = sub === "on";
    setGroupSettings(groupId, { welcome: status });

    await sock.sendMessage(groupId, {
      text: `✅ Welcome/Leave messages have been turned *${status ? "on" : "off"}*!`,
    }, { quoted: msg });
  },

zaynEvent: async function ({ sock, update }) {
    const groupId = update.id;
    let groupSettings = getGroupSettings(groupId);

    if (groupSettings === undefined || groupSettings?.welcome === undefined) {
      setGroupSettings(groupId, { welcome: true });
      groupSettings = { welcome: true };
    }

    if (groupSettings.welcome === false) return;

    const metadata = await sock.groupMetadata(groupId);

    const botBase = sock.user.id.split(":")[0];
    const botNumberS = `${botBase}@s.whatsapp.net`;
    const botNumberLid = `${botBase}@lid`;

    for (const participant of update.participants) {
      if (
        update.action === "add" &&
        (participant === botNumberS || participant === botNumberLid)
      ) {
        const text = `Thanks for adding me to *${metadata.subject}*!\n` +
                     `Use /help to see all available commands.`;

        await sock.sendMessage(groupId, { text });
        continue; 
      }

      const username = participant.split("@")[0];
      const pp = await sock.profilePictureUrl(participant, "image").catch(() => "https://i.ibb.co/FzYpDmt/default.png");
      const memberCount = metadata.participants.length;

      if (update.action === "add") {
        const text =
          `👋 Welcome @${username} to *${metadata.subject}*! 🎉\n` +
          `You are the *${memberCount}ᵗʰ* member of this group.\n` +
          `Feel free to introduce yourself!`;

        await sock.sendMessage(groupId, {
          image: { url: pp },
          caption: text,
          mentions: [participant],
        });
      }

      if (update.action === "remove") {
        const text = `😢 @${username} has left *${metadata.subject}*. Farewell!`;

        await sock.sendMessage(groupId, {
          image: { url: pp },
          caption: text,
          mentions: [participant],
        });
      }
    }
  },
};
