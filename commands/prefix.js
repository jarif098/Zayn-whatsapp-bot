module.exports = {
  name: 'prefix',
  aliases: ['zayn'],
  author: "JARiF",
  version: "1.0",
  role: 1,
  description: 'prefix change /',
  noPrefix: true,
  category: "GROUP",

zayn: async function ({ sock, msg, args, sender, config, zaynReply, removeReply }) {
    const jid = msg.key.remoteJid;
    const { getData, saveData } = require('../database/storage.js');

    const prefixes = await getData('prefixesData');

    if (!args[0]) {
      const current = prefixes[jid] || config.prefix;
      return await sock.sendMessage(jid, {
        text: `🌐 System prefix: ${config.prefix}\n🛸 This Thread prefix: *${current}*`
      });
    }

    if (args[0].toLowerCase() === 'change') {
      const newPrefix = args[1];
      if (!newPrefix) {
        return await sock.sendMessage(jid, {
          text: '❌ Please provide a new prefix.\nExample: prefix change !'
        });
      }

      const confirmMsg = await sock.sendMessage(jid, {
        text: `⚠️ Are you sure you want to change the prefix to *${newPrefix}*?\nReact with 👍 to confirm or 👎 to cancel.`,
        mentions: [sender]
      });

      zaynReply(confirmMsg.key.id, async (reactionMsg) => {
        const emoji = reactionMsg.message?.reactionMessage?.text;

        if (emoji === '👍') {
          prefixes[jid] = newPrefix;
          await saveData('prefixesData', prefixes);
          await sock.sendMessage(jid, {
            text: `✅ Prefix changed to *${newPrefix}* for this group.`
          });
        } else if (emoji === '👎') {
          await sock.sendMessage(jid, {
            text: `❌ Prefix change cancelled.`
          });
        } else {
          await sock.sendMessage(jid, {
            text: `❌ Invalid reaction. Prefix change cancelled.`
          });
        }

        removeReply(confirmMsg.key.id);
      });

      return;
    }

    return await sock.sendMessage(jid, {
      text: '❌ Invalid usage. Try:\n*prefix change !*'
    });
  }
};
