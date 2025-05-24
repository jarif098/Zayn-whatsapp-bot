const { exec } = require("child_process");
const { zayn } = require("./sc");

module.exports = {
  name: "shell",
  version: "1.0",
  author: "JARiF",
  aliases: ["sh", "terminal"],
  role: 3,
  description: "Execute shell commands (superadmin only)",
  guide: "shell <command>",
  coolDown: 10,
  category: "DEVELOPER",

  zayn: async ({ sock, msg, args }) => {
    const chatId = msg.key?.remoteJid || msg.chat.id;

    const command = args.join(" ");
    if (!command) {
      await sock.sendMessage(chatId, { text: "⚠️ Usage: shell <command>" }, { quoted: msg });
      return;
    }

    exec(command, { timeout: 10000 }, async (error, stdout, stderr) => {
      let output = "";

      if (error) output += `❌ Error:\n${error.message}\n`;
      if (stderr) output += `⚠️ Stderr:\n${stderr}\n`;
      if (stdout) output += `✅ Output:\n${stdout}\n`;

      if (output.length > 3000) output = output.slice(0, 3000) + "\n...truncated";

      await sock.sendMessage(chatId, { text: output || "✅ Done." }, { quoted: msg });
    });
  }
};