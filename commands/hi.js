module.exports = {
  name: 'hi',
  role: 1,
  author: "JARiF",
  coolDown: 10,
  noPrefix: false,
  category: "DEVELOPER",

  zayn: async ({ message, config }) => {
    const sender = message.sender || message.key?.participant || ""; 
    const { roles } = config;

    const isDev = roles["3"]?.includes(sender) || false;
    const isAdmin = roles["2"]?.includes(sender) || false;

    let reply = 'Hello! You are a user.';
    if (isDev) reply = 'Hello Developer!';
    else if (isAdmin) reply = 'Hello Admin!';

    await message.reply(reply);
  }
};
