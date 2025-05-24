module.exports = {
  name: "adduser",
  aliases: ["add"],
  author: "JARiF",
  version: "1.0",
  role: 0,
  description: "Add a user to the group by phone number.",
  category: "GROUP",
  usage: "adduser <number>",
  noPrefix: false,

  zayn: async function ({ message, args, sock}) {
    const groupId = message.key.remoteJid;

    if (!args[0]) {
      return await message.reply("❗ Usage: !adduser <number>");
    }

    let number = args[0].replace(/\D/g, ''); 
    if (number.length < 8 || number.length > 15) {
      return await message.reply("❌ Invalid number format.");
    }

    const userJid = number + "@s.whatsapp.net";

    try {
      await sock.groupParticipantsUpdate(groupId, [userJid], "add");

      await message.reply(`✅ Added user: @${number}`, {
        mentions: [userJid]
      });
    } catch (err) {
      console.error("Error adding user:", err);
      await message.reply("❌ Failed to add user. Make sure the number is correct, the user hasn't recently left, and I have admin rights.");
    }
  }
};
