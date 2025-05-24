const axios = require("axios");

const sessions = new Map();

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const decodeHTML = (str) =>
  str.replace(/&quot;/g, '"')
     .replace(/&#039;/g, "'")
     .replace(/&amp;/g, "&")
     .replace(/&lt;/g, "<")
     .replace(/&gt;/g, ">");

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
  name: "quiz",
  version: "1.0",
  author: "JARiF",
  description: "Start a trivia quiz. Answer by replying A, B, C, or D.",
  usage: "type quiz",
  aliases: ["trivia"],
  role: 1,
  category: "GAMES",
  noPrefix: false,

  async zayn({ sock, msg, userMoney, SaveData, zaynReply, global }) {
    const chatId = msg.key.remoteJid;

    let trivia;
    try {
      const res = await axios.get("https://opentdb.com/api.php", {
        params: { amount: 1, type: "multiple" },
      });
      if (!res.data.results || res.data.results.length === 0) {
        throw new Error("No trivia questions returned");
      }
      trivia = res.data.results[0];
    } catch (e) {
      await sock.sendMessage(chatId, { text: "❌ Failed to fetch quiz question." }, { quoted: msg });
      return;
    }

    const question = decodeHTML(trivia.question);
    const correctAnswer = decodeHTML(trivia.correct_answer);
    const incorrectAnswers = trivia.incorrect_answers.map(decodeHTML);
    const allAnswers = shuffleArray([correctAnswer, ...incorrectAnswers]);

    const letters = ["A", "B", "C", "D"];
    const answersText = allAnswers.map((a, i) => `${letters[i]}. ${a}`).join("\n");
    const quizText = `🧠 Quiz Time!\n\n${question}\n\n${answersText}\n\nReply with A, B, C, or D to answer.`;

    sessions.set(chatId, {
      question,
      answers: allAnswers,
      correct: correctAnswer,
      askedUsers: new Set(),
    });

    const sentMsg = await sock.sendMessage(chatId, { text: quizText }, { quoted: msg });

    const sockRef = sock;

    const attachReplyHandler = (messageId) => {
      zaynReply(messageId, async (replyMsg) => {
        if (!replyMsg || !replyMsg.message) return;

        const userJID = replyMsg.key.participant || replyMsg.key.remoteJid;
        const session = sessions.get(chatId);
        if (!session) return;

        if (session.askedUsers.has(userJID)) {
          await sockRef.sendMessage(chatId, { text: "❗️You already answered this question." }, { quoted: replyMsg });
          return;
        }

        let answer = "";

        if (replyMsg.message.conversation) {
          answer = replyMsg.message.conversation.trim().toUpperCase();
        } else if (replyMsg.message.extendedTextMessage?.text) {
          answer = replyMsg.message.extendedTextMessage.text.trim().toUpperCase();
        } else {
          await sockRef.sendMessage(chatId, { text: "❌ Please reply with A, B, C, or D." }, { quoted: replyMsg });
          attachReplyHandler(messageId);
          return;
        }

        const index = ["A", "B", "C", "D"].indexOf(answer);
        if (index === -1) {
          await sockRef.sendMessage(chatId, { text: "❌ Invalid answer. Reply with A, B, C, or D." }, { quoted: replyMsg });
          attachReplyHandler(messageId);
          return;
        }

        const selectedAnswer = session.answers[index];

        const userId = getUserId(replyMsg, global);
        if (!userId) return;

        let user = userMoney.find((u) => u.id === userId);
        if (!user) {
          user = { id: userId, money: 0, lastClaim: 0 };
          userMoney.push(user);
        }
        try {
          await sockRef.sendMessage(chatId, { delete: { remoteJid: chatId, id: messageId, fromMe: true } });
        } catch (err) {
          console.error("Failed to delete quiz message:", err);
        }

        if (selectedAnswer === session.correct) {
          user.money += 150;
          await sockRef.sendMessage(chatId, { text: `✅ Correct! 🎉 You earned 150 BDT.` }, { quoted: replyMsg });
        } else {
          user.money -= 50;
          if (user.money < 0) user.money = 0;
          await sockRef.sendMessage(
            chatId,
            {
              text: `❌ Wrong! The correct answer was: ${session.correct}\nYou lost 50 BDT.\nCurrent Balance: ${user.money}`,
            },
            { quoted: replyMsg }
          );
        }

        await SaveData("userMoney");

        session.askedUsers.add(userJID);

        attachReplyHandler(messageId);
      });
    };

    attachReplyHandler(sentMsg.key.id);
  },
};
