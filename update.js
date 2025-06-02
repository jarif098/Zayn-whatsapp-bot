const { exec } = require("child_process");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const https = require("https");
const os = require("os");
const crypto = require("crypto");

const repoPath = path.resolve(__dirname);
const backupRoot = path.resolve(repoPath, "/backup");
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
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

(async () => {
  try {
    const localPkgPath = path.join(repoPath, "package.json");
    if (!fs.existsSync(localPkgPath)) throw new Error("Local package.json not found.");

    const localPkg = JSON.parse(fs.readFileSync(localPkgPath, "utf8"));
    const remotePkgUrl =
      "https://raw.githubusercontent.com/jarif098/Zayn-whatsapp-bot/main/package.json";
    const remotePkg = await fetchJSON(remotePkgUrl);

    const localVersion = localPkg.version || "0.0.0";
    const remoteVersion = remotePkg.version || "0.0.0";

    if (localVersion === remoteVersion) {
      console.log(`✅ Already up to date (v${localVersion}).`);
      return;
    }

    console.log(`🔁 Updating from v${localVersion} to v${remoteVersion}...`);
    await fse.remove(tempPath);

    await new Promise((resolve, reject) => {
      exec(`git clone --depth 1 https://github.com/jarif098/Zayn-whatsapp-bot.git "${tempPath}"`, (err) => {
        if (err) return reject(err);
        resolve();
      });
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
        if (hashFile(tempFile) === hashFile(localFile)) continue;

        await fse.ensureDir(backupPath);
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
          await fse.ensureDir(path.join(backupPath, "commands"));
          await fse.move(localCmdPath, path.join(backupPath, "commands", file));
          await fse.copy(tempCmdPath, localCmdPath);
          modifiedCommands.push(file);
        } else {
          await fse.copy(tempCmdPath, localCmdPath);
          addedCommands.push(file);
        }
      }
    }

    await fse.remove(tempPath);

    console.log(`✅ Update complete! New version: v${remoteVersion}`);
    if (addedCommands.length) console.log(`➕ Added commands:\n- ${addedCommands.join("\n- ")}`);
    if (modifiedCommands.length) console.log(`✏️ Modified commands:\n- ${modifiedCommands.join("\n- ")}`);
    console.log(`📦 Backup created at: ${backupPath}`);

    // console.log("♻️ Restarting bot...");
    // process.exit(2);

  } catch (err) {
    console.error("❌ Update failed:", err.message);
  }
})();
