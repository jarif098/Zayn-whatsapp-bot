module.exports = {
  name: "fakehack",
  aliases: ["hack", "h4ck"],
  version: "1.0",
  author: "JARiF",
  role: 0,
  description: "Simulate hacking a user (fun)",
  guide: "/fakehack <@user>",

  zayn: async function ({ message }) {
       setTimeout(() => message.reply(`🔍 Finding IP... 192.168.0.1`), 1000);
    setTimeout(() => message.reply(`💻 Installing spyware...`), 2000);
    setTimeout(() => message.reply(`📂 Accessing WhatsApp chats...`), 3000);
    setTimeout(() => message.reply(`🗂️ Downloading private data...`), 4000);
    setTimeout(() => message.reply(`✅ Hack complete. Sent everything to your inbox.`), 5000);
 
  }
};
