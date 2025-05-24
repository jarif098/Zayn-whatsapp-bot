const sessions = new Map();

function getUserId(msg, global) {
  let userId = null;
  if (global?.utils?.uid && typeof global.utils.uid === "function") {
    userId = global.utils.uid(msg);
  }
  if (!userId) {
    userId = msg.key.participant || msg.key.remoteJid;
  }
  return userId;
}

module.exports = {
  name: "rps",
  description: "Play Rock-Paper-Scissors with the bot. Reply with Rock, Paper, or Scissors.",
  usage: "type rps",
  aliases: ["rockpaperscissors"],
  role: 1,
  version: "1.0",
  author: "JARiF",
  category: "GAMES",
  noPrefix: false,

  async zayn({ sock, msg, userMoney, SaveData, zaynReply, global }) {
    const chatId = msg.key.remoteJid;
    const options = ["Rock", "Paper", "Scissors"];

    const botChoice = options[Math.floor(Math.random() * options.length)];

    const promptText = `✊🖐️✌️ Rock-Paper-Scissors!\n\nReply with Rock, Paper, or Scissors to play.\n\nWhat is your choice?`;
    const sentMsg = await sock.sendMessage(chatId, { text: promptText }, { quoted: msg });

    zaynReply(sentMsg.key.id, async (replyMsg) => {
      if (!replyMsg || !replyMsg.message) return;

      let userChoice = "";
      if (replyMsg.message.conversation) {
        userChoice = replyMsg.message.conversation.trim().toLowerCase();
      } else if (replyMsg.message.extendedTextMessage?.text) {
        userChoice = replyMsg.message.extendedTextMessage.text.trim().toLowerCase();
      } else {
        await sock.sendMessage(chatId, { text: "❌ Please reply with Rock, Paper, or Scissors." }, { quoted: replyMsg });
        zaynReply(sentMsg.key.id, () => {}); 
        return;
      }

      if (!["rock", "paper", "scissors"].includes(userChoice)) {
        await sock.sendMessage(chatId, { text: "❌ Invalid choice! Reply with Rock, Paper, or Scissors." }, { quoted: replyMsg });
        zaynReply(sentMsg.key.id, () => {}); 
        return;
      }

      const userId = getUserId(replyMsg, global);
      if (!userId) return;

      let user = userMoney.find((u) => u.id === userId);
      if (!user) {
        user = { id: userId, money: 0, lastClaim: 0 };
        userMoney.push(user);
      }

      let resultText;
      if (userChoice === botChoice.toLowerCase()) {
        resultText = `🤝 It's a tie! You both chose ${botChoice}. No money change.`;
      } else if (
        (userChoice === "rock" && botChoice === "Scissors") ||
        (userChoice === "paper" && botChoice === "Rock") ||
        (userChoice === "scissors" && botChoice === "Paper")
      ) {
        user.money += 100;
        resultText = `🎉 You win! Your ${userChoice} beats bot's ${botChoice}.\nYou earned 100 BDT.\nBalance: ${user.money}`;
      } else {
        user.money -= 50;
        if (user.money < 0) user.money = 0;
        resultText = `😢 You lose! Bot's ${botChoice} beats your ${userChoice}.\nYou lost 50 BDT.\nBalance: ${user.money}`;
      }

      await SaveData("userMoney");

      try {
        await sock.sendMessage(chatId, { delete: { remoteJid: chatId, id: sentMsg.key.id, fromMe: true } });
      } catch (e) {
        console.error("Failed to delete original message:", e);
      }

      await sock.sendMessage(chatId, { text: resultText }, { quoted: replyMsg });
    });
  },
};
