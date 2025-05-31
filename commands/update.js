const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const https = require("https");
const os = require("os");
const crypto = require("crypto");

module.exports = {
  name: "update",
  version: "1.3",
  author: "JARiF",
  category: "UTILITY",
  role: 3,
  aliases: ["upgrade", "refresh"],
  isPrefix: true,

  zayn: async function ({ sock, msg, message, zaynReply, removeReply }) {
    const repoPath = path.resolve(__dirname, "..");
    const backupRoot = path.resolve(repoPath, "../backup");
    const tempPath = path.join(os.tmpdir(), "zayn-update-temp");

    function fetchJSON(url) {
      return new Promise((resolve, reject) => {
        https.get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }).on("error", reject);
      });
    }

    function hashFile(filePath) {
      if (!fs.existsSync(filePath)) return null;
      if (!fs.statSync(filePath).isFile()) return null; 
      const data = fs.readFileSync(filePath);
      return crypto.createHash("sha256").update(data).digest("hex");
    }

    try {
      const localPkgPath = path.join(repoPath, "package.json");
      if (!fs.existsSync(localPkgPath)) {
        return await message.reply("❌ Local package.json not found.");
      }

      const localPkg = JSON.parse(fs.readFileSync(localPkgPath, "utf8"));
      const remotePkgUrl =
        "https://raw.githubusercontent.com/jarif098/Zayn-whatsapp-bot/main/package.json";
      const remotePkg = await fetchJSON(remotePkgUrl);

      const localVersion = localPkg.version || "0.0.0";
      const remoteVersion = remotePkg.version || "0.0.0";

      if (localVersion === remoteVersion) {
        return await message.reply(
          `✅ Your bot is already up to date (v${localVersion}).`
        );
      }

      await fse.remove(tempPath);
      await new Promise((resolve, reject) => {
        exec(
          `git clone --depth 1 https://github.com/jarif098/Zayn-whatsapp-bot.git "${tempPath}"`,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(backupRoot, `backup-${timestamp}`);
      await fse.ensureDir(backupPath);

      const files = await fse.readdir(tempPath);
      for (const file of files) {
        if (["config.json", "commands", ".git"].includes(file)) continue;

        const tempFile = path.join(tempPath, file);
        const localFile = path.join(repoPath, file);

        if (!fs.statSync(tempFile).isFile()) continue;

        if (fs.existsSync(localFile)) {
          if (!fs.statSync(localFile).isFile()) continue; 

          const localHash = hashFile(localFile);
          const tempHash = hashFile(tempFile);
          if (localHash === tempHash) continue; 

          await fse.ensureDir(path.join(backupPath));
          await fse.move(localFile, path.join(backupPath, file));
        }

        await fse.copy(tempFile, localFile);
      }

      const localCommandsDir = path.join(repoPath, "commands");
      const tempCommandsDir = path.join(tempPath, "commands");

      const modifiedCommands = [];
      const addedCommands = [];

      if (fs.existsSync(tempCommandsDir)) {
        const commandFiles = await fse.readdir(tempCommandsDir);
        for (const file of commandFiles) {
          if (!file.endsWith(".js")) continue;

          const tempCmdPath = path.join(tempCommandsDir, file);
          const localCmdPath = path.join(localCommandsDir, file);

          if (!fs.statSync(tempCmdPath).isFile()) continue;

          const localExists = fs.existsSync(localCmdPath);
          const localHash = hashFile(localCmdPath);
          const tempHash = hashFile(tempCmdPath);

          if (localExists) {
            if (localHash === tempHash) continue; 

            const backupCmdDir = path.join(backupPath, "commands");
            await fse.ensureDir(backupCmdDir);
            await fse.move(localCmdPath, path.join(backupCmdDir, file));
            await fse.copy(tempCmdPath, localCmdPath);
            modifiedCommands.push(file);
          } else {
            await fse.copy(tempCmdPath, localCmdPath);
            addedCommands.push(file);
          }
        }
      }

      await fse.remove(tempPath); 

      let changesSummary = "";
      if (addedCommands.length)
        changesSummary += `\nAdded commands:\n- ${addedCommands.join("\n- ")}`;
      if (modifiedCommands.length)
        changesSummary += `\nModified commands:\n- ${modifiedCommands.join("\n- ")}`;

      const confirmMsg = await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ Bot updated to v${remoteVersion}!\nChanges:${changesSummary}\nBackup: \`${backupPath}\`\nReact with 👍 to restart or 👎 to cancel.`,
        mentions: [msg.key.participant || msg.key.remoteJid],
      });

      zaynReply(confirmMsg.key.id, async (reactionMsg) => {
        const emoji = reactionMsg.message?.reactionMessage?.text;

        if (emoji === "👍") {
          const restartFile = path.join(repoPath, "database", "restartTime.json");
          fs.writeFileSync(
            restartFile,
            JSON.stringify({
              start: Date.now(),
              jid: msg.key.remoteJid,
            })
          );
          await sock.sendMessage(msg.key.remoteJid, { text: "♻️ Restarting bot now..." });
          process.exit(2);
        } else {
          await sock.sendMessage(msg.key.remoteJid, { text: "❌ Restart cancelled." });
        }

        removeReply(confirmMsg.key.id);
      });
    } catch (err) {
      console.error("Update error:", err);
      await message.reply(`❌ Update failed: ${err.message}`);
    }
  },
};
