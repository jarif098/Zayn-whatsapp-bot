const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'cmd',
  author: 'JARiF',
  version: "1.0",
  description: 'Manage commands: install, loadall, load',
  usage: 'cmd <install|loadall|load> [args]',
  role: 3,
  version: '1.1',
  category: 'UTILITY',
  noPrefix: false,

  zayn: async ({ message, args, commands }) => {
    try {
      const jid = message.key.remoteJid;
      const subcmd = args[0]?.toLowerCase();
      const cmdFolder = path.join(__dirname, '..', 'commands');

      if (!subcmd) {
        return await message.reply('Usage: cmd <install|loadall|load> [args]');
      }

      function clearRequireCache(filePath) {
        try {
          delete require.cache[require.resolve(filePath)];
        } catch {}
      }

      function registerCommand(cmd) {
        if (
          !cmd ||
          typeof cmd.name !== 'string' ||
          (typeof cmd.execute !== 'function' && typeof cmd.zayn !== 'function')
        ) return false;

        const nameLower = cmd.name.toLowerCase();
        commands.set(nameLower, cmd);

        if (Array.isArray(cmd.aliases)) {
          for (const alias of cmd.aliases) {
            const aliasLower = alias.toLowerCase();
            if (!commands.has(aliasLower)) {
              commands.set(aliasLower, cmd);
            }
          }
        }
        return true;
      }

      if (subcmd === 'install') {
        const fileName = args[1];
        if (!fileName || !fileName.endsWith('.js')) {
          return await message.reply('Usage: cmd install <filename.js> <command code>');
        }

        let fullText = '';
        if (message.message?.conversation) fullText = message.message.conversation;
        else if (message.message?.extendedTextMessage?.text) fullText = message.message.extendedTextMessage.text;
        else if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
          fullText = message.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
        } else {
          return await message.reply('❌ Cannot read the full command message.');
        }

        const startIdx = fullText.indexOf(fileName);
        if (startIdx === -1) {
          return await message.reply('❌ Could not find the filename in the message.');
        }

        const code = fullText.slice(startIdx + fileName.length).trim();
        if (!code) return await message.reply('❌ No code provided after filename.');

        const filePath = path.join(cmdFolder, fileName);

        try {
          fs.writeFileSync(filePath, code, 'utf-8');
        } catch {
          return await message.reply('❌ Failed to write command file.');
        }

        try {
          clearRequireCache(filePath);
          const loadedCmd = require(filePath);

          if (!registerCommand(loadedCmd)) {
            fs.unlinkSync(filePath);
            return await message.reply('❌ Invalid command format. Installation aborted.');
          }

          return await message.reply(`✅ Command '${loadedCmd.name}' installed successfully!`);
        } catch {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          return await message.reply('❌ Failed to load command. Installation aborted.');
        }
      }

      else if (subcmd === 'loadall') {
        if (!commands) return await message.reply('❌ Commands collection unavailable.');

        const files = fs.readdirSync(cmdFolder).filter(f => f.endsWith('.js'));
        let loaded = 0;

        for (const file of files) {
          try {
            const filePath = path.join(cmdFolder, file);
            clearRequireCache(filePath);
            const cmd = require(filePath);
            if (registerCommand(cmd)) loaded++;
            else await message.reply(`❌ Invalid command format: ${file}`);
          } catch {
            await message.reply(`❌ Failed to load: ${file}`);
          }
        }

        return await message.reply(`✅ Loaded ${loaded}/${files.length} commands.`);
      }

      else if (subcmd === 'load') {
        const cmdName = args[1];
        if (!cmdName) return await message.reply('❌ Specify a command name to load.');

        const filePath = path.join(cmdFolder, cmdName + '.js');
        if (!fs.existsSync(filePath)) return await message.reply('❌ Command file not found.');

        try {
          clearRequireCache(filePath);
          const cmd = require(filePath);
          if (!registerCommand(cmd)) throw new Error('Invalid command format');
          return await message.reply(`✅ Command '${cmdName}' loaded successfully.`);
        } catch {
          return await message.reply(`❌ Failed to load command '${cmdName}'.`);
        }
      }

      else {
        return await message.reply('❌ Unknown subcommand. Use install, loadall, or load.');
      }
    } catch (err) {
      console.error('CMD Error:', err);
      await message.reply('❌ An unexpected error occurred.');
    }
  }
};
