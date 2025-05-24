module.exports = {
  name: "unsend",
  version: "1.0",
  author: "JARiF",
  aliases: ["delete", "remove"],
  role: 1,
  description: "Unsend (delete) the replied message.",
  noPrefix: true,
  category: "UTILITY",

  zayn: async ({ sock, msg }) => {
    const chatId = msg.key.remoteJid;
    const isGroup = chatId.endsWith("@g.us");

    if (!msg.message?.extendedTextMessage?.contextInfo?.stanzaId) {
      await sock.sendMessage(chatId, { text: "❌ Please reply to the message you want to unsend." }, { quoted: msg });
      return;
    }

    const targetMsgKey = {
      remoteJid: chatId,
      fromMe: false, 
      id: msg.message.extendedTextMessage.contextInfo.stanzaId,
      participant: isGroup
        ? msg.message.extendedTextMessage.contextInfo.participant
        : undefined
    };

    try {
      await sock.sendMessage(chatId, { delete: targetMsgKey });
    } catch (err) {
      console.error("Failed to unsend message:", err);
      await sock.sendMessage(chatId, { text: "❌ Failed to unsend the message. It may not be deletable." }, { quoted: msg });
    }
  }
};
