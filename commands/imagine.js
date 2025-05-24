const axios = require("axios");

module.exports = {
  name: "imagine",
  author: 'JARiF',
  version: '1.0',
  description: "Generate images from text prompt and send all images",
  usage: "imagine prompt --quantity 5",
  aliases: ["texttoimage"],
  role: 1,
  category: 'AI',
  noPrefix: false,

  zayn: async function ({ message, args, api }) {
    try {
      if (!args.length) {
        return await message.reply("⚠️ Please provide a prompt.");
      }

      let prompt = args.join(" ");
      let quantity = 4;

      const quantityMatch = prompt.match(/--quantity\s+(\d+)/i);
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1]);
        if (isNaN(quantity) || quantity < 1 || quantity > 10) {
          return await message.reply("⚠️ Quantity must be a number between 1 and 10.");
        }
        prompt = prompt.replace(/--quantity\s+\d+/i, "").trim();
      }

      if (!prompt) {
        return await message.reply("⚠️ Please provide a valid prompt.");
      }

      await message.reply(`⏳ Generating ${quantity} image(s)...`);

      const imageUrls = [];
      const ratio = "1:1";

      for (let i = 0; i < quantity; i++) {
        const res = await axios.get("https://www.ai4chat.co/api/image/generate", {
          params: {
            prompt,
            aspect_ratio: ratio,
          },
        });

        if (res.data?.image_link) {
          imageUrls.push(res.data.image_link);
        }
      }

      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        const response = await axios.get(url, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data, "binary");

        await api.sendMessage(message.key.remoteJid, {
          image: buffer,
          mimetype: "image/jpeg",
          caption: i === 0 ? `✅ Image generation completed.\nPrompt: ${prompt}` : undefined
        }, {
          quoted: i === 0 ? message : undefined,
        });
      }

    } catch (error) {
      console.error("Image generation error:", error.message || error);
      await message.reply("❌ Failed to generate images.");
    }
  },
};
