const os = require("os");
const process = require("process");

module.exports = {
  name: "uptime",
  version: "1.0",
  author: "JARiF",
  description: "Show detailed info about the bot and server",
  usage: "botinfo",
  aliases: ["upt", "status", "aboutbot"],
  role: 0,
  cooldown: 5,
  category: "UTILITY",

  async execute({ sock, msg }) {
    try {
      const groupId = msg.key.remoteJid;

      const uptimeSeconds = process.uptime();
      const days = Math.floor(uptimeSeconds / (3600 * 24));
      const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeSeconds % 60);
      const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const hostname = os.hostname();
      const platform = os.platform();
      const arch = os.arch();
      const release = os.release();

      const cpus = os.cpus();
      const cpuModel = cpus[0].model;
      const cpuCores = cpus.length;

      const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(2);
      const freeMemMB = (os.freemem() / 1024 / 1024).toFixed(2);
      const usedMemMB = (totalMemMB - freeMemMB).toFixed(2);

      const nodeVersion = process.version;


      const botName = "Zayn V1";
      const botVersion = "1.0.0";

      const text = 
        `*${botName}* - Version: ${botVersion}\n` +
        `⏱️ Uptime: ${uptimeStr}\n` +
        `💻 Host Info:\n` +
        `  • Hostname: ${hostname}\n` +
        `  • Platform: ${platform} (${arch})\n` +
        `  • OS Release: ${release}\n` +
        `🧠 CPU:\n` +
        `  • Model: ${cpuModel}\n` +
        `  • Cores: ${cpuCores}\n` +
        `🗄️ Memory:\n` +
        `  • Used: ${usedMemMB} MB\n` +
        `  • Free: ${freeMemMB} MB\n` +
        `  • Total: ${totalMemMB} MB\n` +
        `Node.js Version: ${nodeVersion}\n`;

      await sock.sendMessage(
        groupId,
        { text, mentions: [msg.sender] },
        { quoted: msg }
      );
    } catch (err) {
      console.error("botinfo command error:", err);
    }
  },
};
