const https = require("https");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

module.exports = function push(sock) {
   const adminJid = config.roles?.["3"];
if (!adminJid) {
    console.warn("❌ No admin JID found in config.roles[\"3\"]");
    return;
  }

  const localPkgPath = path.join(__dirname, "package.json");
  if (!fs.existsSync(localPkgPath)) {
    console.warn("❌ Local package.json not found.");
    return;
  }

  let lastVersion = JSON.parse(fs.readFileSync(localPkgPath)).version;

  const fetchRemoteVersion = () => new Promise((resolve, reject) => {
    https.get("https://raw.githubusercontent.com/jarif098/Zayn-whatsapp-bot/main/package.json", (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json.version);
        } catch (err) {
          reject(err);
        }
      });
    }).on("error", reject);
  });

  setInterval(async () => {
    try {
      const remoteVersion = await fetchRemoteVersion();
      if (remoteVersion !== lastVersion) {
        lastVersion = remoteVersion;
        await sock.sendMessage(adminJid, {
          text: `🚀 New push detected! Latest version: *v${remoteVersion}*\n\nTo update the bot, type:\n${config.prefix}update to update your bot to the latest version *v${remoteVersion}*`
        });
      }
    } catch (err) {
      console.error("Push monitor error:", err.message);
    }
  }, 30 * 1000); // Check every 30s

  console.log("📡 Push monitor started.");
};
