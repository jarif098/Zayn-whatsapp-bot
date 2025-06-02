const fs = require("fs").promises;
const axios = require("axios");

module.exports = {
  name: 'runmocky',
  aliases: ['run'],
  author: "Romeo",
  version: "1.0",
  role: 2,
  description: 'Convert code to mocky.io link',
  noPrefix: false,
  category: "UTILITY",

  zayn: async function ({ sock, msg, message, args, sender }) {
    const jid = msg.key.remoteJid;
    const fileName = args[0];
    let code = null;

    
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
      code = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text;
    } else if (!fileName) {
      await sock.sendMessage(jid, {
        text: "Please specify the filename or reply with code.",
        mentions: [sender]
      });
      return;
    }

    if (!code) {
      const filePath = `commands/${fileName}.js`;
      try {
        code = await fs.readFile(filePath, "utf-8");
      } catch (error) {
        if (error.code === "ENOENT") {
          await sock.sendMessage(jid, {
            text: "File not found. Please ensure the file exists in the `commands/` directory.",
            mentions: [sender]
          });
        } else {
          await sock.sendMessage(jid, {
            text: "Error occurred while processing the command.",
            mentions: [sender]
          });
        }
        return;
      }
    }

    const mockyUrl = "https://api.mocky.io/api/mock";
    const requestData = {
      status: 200,
      content: code,
      content_type: "application/json",
      charset: "UTF-8",
      secret: "ULYqac30bH07pa8r7u3eAK7dPwAW9Nc0uR7G",
      expiration: "never",
    };

    try {
      const response = await axios.post(mockyUrl, requestData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data && response.data.link) {
        const runmockyLink = response.data.link;
        await sock.sendMessage(jid, {
          text: runmockyLink,
          mentions: [sender]
        });
      } else {
        throw new Error("API response does not contain the expected link.");
      }
    } catch (error) {
      await sock.sendMessage(jid, {
        text: "Error occurred while processing the command.",
        mentions: [sender]
      });
    }
  },
}; 
