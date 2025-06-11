const axios = require('axios');
const newsSessions = new Map();

function getUserId(msg, global) {
  if (global?.utils?.uid && typeof global.utils.uid === "function") {
    return global.utils.uid(msg);
  }
  return msg.key.participant || msg.key.remoteJid;
}

module.exports = {
  name: 'newsbd',
  author: "JARiF",
  version: "1.0",
  role: 1,
  description: "BBC বাংলা থেকে সর্বশেষ খবর দেখুন",
  usage: "news",
  category: "UTILITIES",
  coolDown: 10,
  noPrefix: false,

  zayn: async ({ sock, msg, message, zaynReply, global }) => {
    const chatId = msg.key.remoteJid;

    let news;
    try {
      const res = await axios.get('https://apis.vyturex.com/bbcnews');
      news = res.data;
      if (!Array.isArray(news) || news.length === 0) {
        return message.reply("😔 দুঃখিত, কোনো খবর পাওয়া যায়নি। পরে আবার চেষ্টা করুন।");
      }
    } catch (err) {
      console.error("BBC API error:", err);
      return message.reply("❌ খবর আনতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    }

    let text = "📰 *BBC বাংলা শিরোনাম (১-৫)*:\n\n";
    for (let i = 0; i < Math.min(news.length, 5); i++) {
      text += `*${i + 1}. ${news[i].title}*\n`;
    }
    text += `\n📥 বিস্তারিত জানতে ১-৫ এর মধ্যে একটি নাম্বার রিপ্লাই করুন।`;

    const sentMsg = await message.reply(text.trim());

    newsSessions.set(chatId, {
      newsList: news.slice(0, 5),
      repliedUsers: new Set(),
      firstMsgId: sentMsg.key.id, 
    });

    zaynReply(sentMsg.key.id, async (replyMsg) => {
      const session = newsSessions.get(chatId);
      if (!session) return;

      const userId = getUserId(replyMsg, global);
      if (session.repliedUsers.has(userId)) {
        return message.reply("❗️আপনি ইতিমধ্যে একবার জানতে চেয়েছেন।", { quoted: replyMsg });
      }

      let body = "";
      if (replyMsg.message.conversation) {
        body = replyMsg.message.conversation;
      } else if (replyMsg.message.extendedTextMessage?.text) {
        body = replyMsg.message.extendedTextMessage.text;
      } else {
        return message.reply("❌ অনুগ্রহ করে নাম্বার লিখে রিপ্লাই করুন।", { quoted: replyMsg });
      }

      const choice = parseInt(body.trim());
      if (isNaN(choice) || choice < 1 || choice > session.newsList.length) {
        return message.reply("❌ অনুগ্রহ করে ১ থেকে ৫ এর মধ্যে একটি সঠিক সংখ্যা দিন।", { quoted: replyMsg });
      }

      try {
        await sock.sendMessage(chatId, {
          delete: {
            remoteJid: chatId,
            id: session.firstMsgId,
            fromMe: true
          }
        });
      } catch (e) {
        console.error("Failed to delete first news list message:", e);
      }

      const selected = session.newsList[choice - 1];
      const idMatch = selected.link.match(/\/articles\/([^\/?#]+)/);
      const articleId = idMatch ? idMatch[1] : null;

      try {
        const detail = await axios.get(`https://apis.vyturex.com/bbcpost?id=${articleId}`);
        const data = detail.data;

        const img = data.image;
        let replyText = `📰 *${data.captions}*\n\n🕒 প্রকাশিত: ${data.time}\n\n🔗 https://www.bbc.com/bengali/articles/${articleId}\n\n📝 ${data.paragraphs || "সংক্ষিপ্তসার পাওয়া যায়নি।"}`;

      await message.stream(img, { type: 'image', caption: replyText , mimetype: 'image/jpeg' });

 
      } catch (err) {
        console.error("Detail fetch error:", err);
        await message.reply("❌ বিস্তারিত খবর আনতে সমস্যা হয়েছে।", { quoted: replyMsg });
      }

      session.repliedUsers.add(userId);
    });
  }
};
