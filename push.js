const https = require("https");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

module.exports = function push(sock) {
  const rawAdminJid = config.roles?.["3"];
  const adminJids = Array.isArray(rawAdminJid) ? rawAdminJid : [rawAdminJid];

  if (!adminJids || adminJids.length === 0) {
    console.warn("❌ No admin JID found in config.roles[\"3\"]");
    return;
  }

  const normalizeJid = (jid) => {
    if (typeof jid !== "string") return null;
    if (jid.endsWith("@s.whatsapp.net")) return jid;
    if (jid.endsWith("@lid")) {
      const number = jid.split("@")[0];
      return number + "@s.whatsapp.net";
    }
    if (/^\d+$/.test(jid)) {
      return jid + "@s.whatsapp.net";
    }
    return null;
  };

  const localPkgPath = path.join(__dirname, "package.json");
  if (!fs.existsSync(localPkgPath)) {
    console.warn("❌ Local package.json not found.");
    return;
  }

  let lastVersion = JSON.parse(fs.readFileSync(localPkgPath)).version;

  const fetchRemoteVersion = () =>
    new Promise((resolve, reject) => {
      https.get(
        "https://raw.githubusercontent.com/jarif098/Zayn-whatsapp-bot/main/package.json",
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const json = JSON.parse(data);
              resolve(json.version);
            } catch (err) {
              reject(err);
            }
          });
        }
      ).on("error", reject);
    });

  setInterval(async () => {
    try {
      const remoteVersion = await fetchRemoteVersion();
      if (remoteVersion !== lastVersion) {
        lastVersion = remoteVersion;

        for (const raw of adminJids) {
          const jid = normalizeJid(raw);
          if (!jid) continue;
          await sock.sendMessage(jid, {
            text: `🚀 New push detected! Latest version: *v${remoteVersion}*\n\nTo update the bot, type:\n${config.prefix}update to update your bot to the latest version *v${remoteVersion}*`,
          });
        }
      }
    } catch (err) {
      console.error("Push monitor error:", err.message);
    }
  }, 30 * 1000);

  console.log("📡 Push monitor started.");
};
