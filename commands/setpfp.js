const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
  name: "setpfp",
  author: 'JARiF',
  description: "Change the bot's profile picture",
  usage: "setpfp (with image)",
  role: 3,
  aliases: ["spfp"],
  version: '1.0',
  category: 'UTILITY',
  noPrefix: false, 

  async zayn({ sock, msg }) {
    try {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imageMessage = quoted?.imageMessage || msg.message?.imageMessage;

      if (!imageMessage) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: "⚠️ Please send or reply to an image with the command `.setpfp`." },
          { quoted: msg }
        );
      }

      const stream = await downloadContentFromMessage(imageMessage, "image");

      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const resizedBuffer = await sharp(buffer)
        .resize(640, 640, { fit: "cover" })
        .jpeg()
        .toBuffer();

      const filePath = path.join(__dirname, "../tmp/tmp-pfp.jpg");
      fs.writeFileSync(filePath, resizedBuffer);

      await sock.updateProfilePicture(sock.user.id, resizedBuffer);

      fs.unlinkSync(filePath);

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "✅ Bot profile picture updated successfully!" },
        { quoted: msg }
      );
    } catch (error) {
      console.error("Error setting profile picture:", error);
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Failed to update profile picture." },
        { quoted: msg }
      );
    }
  },
};
