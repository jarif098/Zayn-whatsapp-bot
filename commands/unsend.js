module.exports = {
  name: "unsend",
  version: "2.1",
  author: "TawsiN | JARiF",
  aliases: ["delete", "remove"],
  role: 1,
  description: "Unsend (delete) the replied message. Only works for your own messages.",
  noPrefix: false,
  category: "UTILITY",

  zayn: async ({ sock, msg }) => {
    const chatId = msg.key.remoteJid;

    const context = msg.message?.extendedTextMessage?.contextInfo;
    const stanzaId = context?.stanzaId;
    const participant = context?.participant;

    if (!stanzaId) {
      await sock.sendMessage(chatId, {
        text: "❌ Please reply to a message you want to unsend."
      }, { quoted: msg });
      return;
    }

    const messageKey = {
      remoteJid: chatId,
      id: stanzaId,
      fromMe: true,
      participant: chatId.endsWith("@g.us") ? participant : undefined
    };

    try {
      await sock.sendMessage(chatId, { delete: messageKey });
    } catch (err) {
      console.error("❌ Failed to delete message:", err);
      await sock.sendMessage(chatId, {
        text: "❌ Can't unsend this message. It must be your own and recent."
      }, { quoted: msg });
    }
  }
};
