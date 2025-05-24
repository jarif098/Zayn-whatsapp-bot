const fs = require("fs");
const path = require("path");

module.exports = {
  name: "help",
  version: "1.0",
  author: "JARiF",
  category: "UTILITY",
  role: 0,
  aliases: ["menu"],
  isPrefix: false,

  zayn: async function({ message, args }) {
    const commandName = args[0]?.toLowerCase();

    function safeString(val, def = "N/A") {
      if (!val) return def;
      if (Array.isArray(val)) return val.join(", ");
      return String(val);
    }

    const commandFiles = fs.readdirSync(__dirname)
      .filter(f => f.endsWith(".js") && f !== "help.js");

    if (!commandName) {
      const categories = {};
      for (const file of commandFiles) {
        try {
          const fullPath = path.join(__dirname, file);
          delete require.cache[require.resolve(fullPath)];
          const cmdModule = require(fullPath);
          const c = cmdModule.config || {};
          const name = safeString(c.name || cmdModule.name || file.replace(".js", ""));
          const category = safeString(c.category || cmdModule.category || "Uncategorized");

          if (!categories[category]) categories[category] = [];
          categories[category].push(name);
        } catch (e) {
          console.error(`Error loading command ${file}:`, e);
          if (!categories["Uncategorized"]) categories["Uncategorized"] = [];
          categories["Uncategorized"].push(file.replace(".js", ""));
        }
      }

     let messageText = "";
let totalCommands = 0;

for (const category in categories) {
  messageText += `╭─────『 ${category.toUpperCase()} 』\n`;
  const cmds = categories[category];
  for (let i = 0; i < cmds.length; i += 2) {
    const first = cmds[i];
    const second = cmds[i + 1] || "";
    if (second) {
      messageText += `│ ▸ ${first}  ▸ ${second}\n`; 
    } else {
      messageText += `│ ▸ ${first}\n`;  
    }
  }
  messageText += "╰──────────────\n";
  totalCommands += cmds.length;
}



      messageText += "╭──────────────◊\n";
      messageText += `│ » Total commands: ${totalCommands}\n`;
      messageText += "│ » A Powerful WhatsApp bot\n";
      messageText += "│ » By JARiF\n";
      messageText += "╰──────────◊\n";
      messageText += "「 Zayn Bot 」";

      return await message.reply(messageText);
    }

    let cmdFile = null;

    for (const file of commandFiles) {
      const fullPath = path.join(__dirname, file);
      delete require.cache[require.resolve(fullPath)];
      const mod = require(fullPath);

      const names = [mod.config?.name?.toLowerCase(), mod.name?.toLowerCase()].filter(Boolean);
      const aliases = mod.config?.aliases?.map(a => a.toLowerCase()) || [];

      if (names.includes(commandName) || aliases.includes(commandName)) {
        cmdFile = mod;
        break;
      }
    }

    if (!cmdFile) {
      return await message.reply(`❌ Command "${commandName}" not found.`);
    }

    const c = cmdFile.config || {};

    const name = safeString(c.name || cmdFile.name || commandName);
    const version = safeString(c.version || cmdFile.version, "Unknown");
    const author = safeString(c.author || cmdFile.author, "Unknown");
    const aliases = safeString(c.aliases || cmdFile.aliases, "None");
    const role = c.role ?? cmdFile.role ?? 0;
    const category = safeString(c.category || cmdFile.category, "Uncategorized");
    const description = safeString(c.description || cmdFile.description, "No description available.");
    const isPrefix = (c.isPrefix ?? cmdFile.isPrefix) ? "True" : "False";

    const roleText = role === 1 ? "Only Admins" : role === 2 ? "Admins & Mods" : "All Users";

    const detailMessage =
      "╭─────────────────────◊\n" +
      `│ ▸ Command: ${name}\n` +
      `│ ▸ Version: ${version}\n` +
      `│ ▸ Aliases: ${aliases}\n` +
      `│ ▸ Author: ${author}\n` +
      `│ ▸ Can use: ${roleText}\n` +
      `│ ▸ Category: ${category}\n` +
      `│ ▸ Description: ${description}\n` +
      `│ ▸ PrefixEnabled?: ${isPrefix}\n` +
      "╰─────────────────────◊";

    return await message.reply(detailMessage);
  }
};
