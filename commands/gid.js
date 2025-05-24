module.exports = {
  name: 'gid',
  author: 'JARiF',
  version: "1.0",
  aliases: ['groupid', 'getgid'],
  role: 0,
  description: 'Shows the current group ID',
  category: 'GROUP',
  
 zayn: async function({ message }) {
  const id = message.key.remoteJid;
    if (!id.endsWith('@g.us')) {
      return await message.reply('❌ This command can only be used in groups.');
    }

    await message.reply(`🆔: \`\`\`${id}\`\`\``);
  }
};
