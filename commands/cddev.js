const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'cooldowndev',
  author: 'JARiF',
  version: "1.0",
  aliases: ['cddev', 'cooldev'],
  description: 'Toggle CoolDownForDev ON/OFF (devs only)',
  usage: 'cooldowndev',
  role: 3, 
  noPrefix: false,
  version: '1.0',
  category: 'UTILITY',

  zayn: async function ({ message, sender}) {
    try {
      const configPath = path.join(__dirname, '..', 'config.json');

      delete require.cache[require.resolve(configPath)];
      const config = require(configPath);

      const devs = config.roles?.['3'] || [];
      if (!devs.includes(sender)) {
        return await message.reply('❌ You are not authorized to use this command.');
      }

      config.CoolDownForDev = !config.CoolDownForDev;

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      await message.reply(`✅ CoolDownForDev is now set to: ${config.CoolDownForDev}`);
    } catch (e) {
      console.error('Error toggling CoolDownForDev:', e);
      await message.reply('❌ Failed to toggle CoolDownForDev.');
    }
  }
};
