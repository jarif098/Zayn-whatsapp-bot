module.exports = {
  name: 'eval',
  role: 3,
  author: 'JARiF',
  version: '1.1',
  category: "DEVELOPER",
  noPrefix: true,

  zayn: async ({
    sock,
    msg,
    message, 
    args,
    api,
    sender,
    config,
    commands,
    addReply,
    zaynReply,
    removeReply,
    userMoney,
    prefixesData,
    groupSettings,
    SaveData,
    GetData
  }) => {
    async function out(output) {
      if (typeof output === 'object') {
        output = JSON.stringify(output, null, 2);
      }
      return await message.reply('```\n' + output + '\n```');
    }

    try {
      const code = args.join(' ');

      let evalResult = await eval(`(async () => { ${code} })()`);

      await out(evalResult);

    } catch (err) {
      await out(err.toString());
    }
  }
};
