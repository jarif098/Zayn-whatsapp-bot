const axios = require("axios");
const sessions = new Map();

function getUserId(msg, global) {
  if (global?.utils?.uid && typeof global.utils.uid === "function") {
    return global.utils.uid(msg);
  }
  return msg.key.participant || msg.key.remoteJid;
}

module.exports = {
  name: "flag",
  author: "JARiF",
  version: "1.0",
  role: 1,
  description: "Guess the country from its flag and win or lose money!",
  usage: "flag",
  category: "GAMES",
  noPrefix: false,

  zayn: async ({ sock, msg, message, zaynReply, userMoney, SaveData, global }) => {
    const chatId = msg.key.remoteJid;

    let countryData;
    try {
      const res = await axios.get("https://restcountries.com/v3.1/all");
      const countries = res.data.filter(
        (c) => c.flags?.png && c.name?.common
      );
      countryData = countries[Math.floor(Math.random() * countries.length)];
    } catch (e) {
      console.error("Flag API error:", e);
      return await message.reply("❌ Could not load a flag. Try again later.", { quoted: msg });
    }

    const correctAnswer = countryData.name.common.toLowerCase();
    const flagImageUrl = countryData.flags.png;

    sessions.set(chatId, {
      country: correctAnswer,
      answered: false,
      askedUsers: new Set(),
    });

    const sentMsg = await sock.sendMessage(
      chatId,
      {
        image: { url: flagImageUrl },
        caption: "🌍 Guess the country from this flag!\nReply with the country's name.",
      },
      { quoted: msg }
    );

    zaynReply(sentMsg.key.id, async (replyMsg) => {
      if (!replyMsg || !replyMsg.message) return;

      const session = sessions.get(chatId);
      if (!session) return;

      const userId = getUserId(replyMsg, global) || "unknown";

      if (session.askedUsers.has(userId)) {
        return await message.reply("❗️You already answered this question.", { quoted: replyMsg });
      }

      if (session.answered) {
        return await message.reply("❗️The quiz has ended, wait for a new one.", { quoted: replyMsg });
      }

      let body = "";
      if (replyMsg.message.conversation) {
        body = replyMsg.message.conversation;
      } else if (replyMsg.message.extendedTextMessage?.text) {
        body = replyMsg.message.extendedTextMessage.text;
      } else {
        return await message.reply("❌ Please reply with your guess as text.", { quoted: replyMsg });
      }

      const guess = body.trim().toLowerCase();

      // Find or initialize user in userMoney array
      let user = userMoney.find((u) => u.id === userId);
      if (!user) {
        user = { id: userId, money: 0, lastClaim: 0 };
        userMoney.push(user);
      }

      session.answered = true;

      // Delete the flag image message to keep chat clean
      try {
        await sock.sendMessage(chatId, {
          delete: { remoteJid: chatId, id: sentMsg.key.id, fromMe: true },
        });
      } catch (err) {
        console.error("Failed to delete flag message:", err);
      }

      if (guess === session.country) {
        user.money += 150;
        await message.reply(
          `✅ Correct! 🎉 You earned 150 BDT.\nYour new balance: ${user.money} BDT`,
          { quoted: replyMsg }
        );
      } else {
        user.money -= 50;
        if (user.money < 0) user.money = 0;
        await message.reply(
          `❌ Wrong! The correct answer was **${session.country.toUpperCase()}**.\nYou lost 50 BDT.\nYour new balance: ${user.money} BDT`,
          { quoted: replyMsg }
        );
      }

      await SaveData("userMoney");

      session.askedUsers.add(userId);
    });
  },
};
