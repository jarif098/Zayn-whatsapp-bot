module.exports = {
  name: "time",
  aliases: ["now"],
  version: "1.0",
  author: "JARiF",
  role: 1,
  description: "Shows the current time",
  guide: "time",

  async execute({ message }) {
    const now = new Date();
    message.reply(`🕒 Current time: ${now.toLocaleTimeString()}`);
  }
};
