const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  name: 'fastx',
  author: 'JARiF',
  version: "1.0",
  aliases: ['fast'],
  role: 1,
  coolDown: 10,
  version: '1.3',
  category: 'AI',

  zayn: async ({ sock, msg, message, args, addReply }) => {
    const start = Date.now();
    let prompt = "";
    let ratio = "1:1";

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--ar" && args[i + 1]) {
        ratio = args[i + 1];
        i++;
      } else {
        prompt += args[i] + " ";
      }
    }
    prompt = prompt.trim();

    if (!prompt) {
      return await message.reply("❌ Please provide a prompt for image generation.");
    }

    const chatId = msg.key.remoteJid;
    const cacheDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const waitingMsg = await sock.sendMessage(chatId, { text: "🧠 Generating images..." }, { quoted: msg });

    try {
      const numImages = 4;

      const imageUrls = await Promise.all(
        Array(numImages).fill(null).map(async () => {
          const { data } = await axios.get(`https://www.ai4chat.co/api/image/generate?prompt=${encodeURIComponent(prompt)}&aspect_ratio=${encodeURIComponent(ratio)}`);
          return data.image_link;
        })
      );

      const images = await Promise.all(imageUrls.map(async (url, i) => {
        const filePath = path.join(cacheDir, `fastx_${msg.key.id}_${i + 1}.jpg`);
        const writer = fs.createWriteStream(filePath);
        const res = await axios({ url, method: "GET", responseType: "stream" });
        res.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
        return filePath;
      }));

      const imgs = await Promise.all(images.map(p => loadImage(p)));

      const w = imgs[0].width;
      const h = imgs[0].height;
      const canvas = createCanvas(w * 2, h * 2);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w * 2, h * 2);

      ctx.drawImage(imgs[0], 0, 0, w, h);
      ctx.drawImage(imgs[1], w, 0, w, h);
      ctx.drawImage(imgs[2], 0, h, w, h);
      ctx.drawImage(imgs[3], w, h, w, h);

      const gridPath = path.join(cacheDir, `fastx_${msg.key.id}_0.jpg`);
      const buffer = canvas.toBuffer("image/jpeg");
      fs.writeFileSync(gridPath, buffer);

      const sentMsg = await sock.sendMessage(chatId, {
        image: buffer,
        mimetype: "image/jpeg",
        caption: `✅ Prompt: "${prompt}"\nAspect Ratio: ${ratio}\nTime: ${((Date.now() - start) / 1000).toFixed(2)}s\n\nReply with 1, 2, 3, or 4 to get individual images.`,
      }, { quoted: msg });

      await sock.sendMessage(chatId, {
        delete: {
          remoteJid: chatId,
          fromMe: true,
          id: waitingMsg.key.id
        }
      });

      const sentImages = new Set();

      const attachReplyHandler = (messageId) => {
        addReply(messageId, async (resMsg) => {
          let body = '';

          if (resMsg.message.conversation) {
            body = resMsg.message.conversation;
          } else if (resMsg.message.extendedTextMessage?.text) {
            body = resMsg.message.extendedTextMessage.text;
          }

          const choice = body?.trim();

          if (!["0", "1", "2", "3", "4"].includes(choice)) {
            await message.reply("❌ Please reply with 1, 2, 3, or 4.", { quoted: resMsg });
            attachReplyHandler(messageId);
            return;
          }

          if (choice === "0") {
            if (!fs.existsSync(gridPath)) {
              return await message.reply("❌ Grid image not found.", { quoted: resMsg });
            }

            const newGridMsg = await sock.sendMessage(chatId, {
              image: fs.readFileSync(gridPath),
              mimetype: "image/jpeg",
              caption: "🧩 Grid image again.\nReply with 1–4 to get a single image.",
            }, { quoted: resMsg });

            attachReplyHandler(newGridMsg.key.id);
            return;
          }

          const index = parseInt(choice) - 1;
          const imagePath = images[index];

          if (!fs.existsSync(imagePath)) {
            return await message.reply("❌ Selected image not found.", { quoted: resMsg });
          }

          const newImgMsg = await sock.sendMessage(chatId, {
            image: fs.readFileSync(imagePath),
            mimetype: "image/jpeg",
            caption: `🖼️ Here is image ${choice}`,
          }, { quoted: resMsg });

          try {
            await sock.sendMessage(chatId, {
              delete: {
                remoteJid: chatId,
                fromMe: true,
                id: sentMsg.key.id
              }
            });
          } catch (e) {
            console.error("Couldn't delete grid message:", e);
          }

          sentImages.add(choice);

          if (sentImages.size < 4) {
            attachReplyHandler(newImgMsg.key.id);
          }
        });
      };

      attachReplyHandler(sentMsg.key.id);

    } catch (e) {
      console.error("FastX error:", e);
      await message.reply("❌ Failed to generate images.", { quoted: msg });
    }
  }
};
