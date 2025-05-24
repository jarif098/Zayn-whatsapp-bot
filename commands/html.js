const axios = require("axios");

function randomPassword(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

module.exports = {
  name: "html",
  author: "JARiF",
  version: "1.0",
  aliases: ["pastehtml"],
  role: 0,
  description: "Paste content as random.html with random password or edit existing paste",
  guide: `html <content>\nhtml edit <filename> <password> <new content>`,
  category: "UTILITY",

  zayn: async ({ message, args }) => {
    if (args.length === 0) {
      await message.reply("Usage:\nhtml <content>\nhtml edit <filename> <password> <new content>");
      return;
    }

    if (args[0].toLowerCase() === "edit") {
      if (args.length < 4) {
        await message.reply("Usage: html edit <filename> <password> <new content>");
        return;
      }

      const filename = args[1];
      const password = args[2];
      const newContent = args.slice(3).join(" ");

      const postData = {
        filename,
        password,
        content: newContent,
      };

      try {
        await axios.post(
          "https://liveyourweb.vyturex.com/",
          postData,
          {
            headers: {
              accept: "*/*",
              "accept-language": "en-US,en;q=0.9,vi;q=0.8",
              "content-type": "application/json",
              origin: "https://liveyourweb.vyturex.com",
              priority: "u=1, i",
              referer: "https://liveyourweb.vyturex.com/",
              "sec-ch-ua": `"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"`,
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": `"Windows"`,
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
              "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
            },
          }
        );

        const url = `https://liveyourweb.vyturex.com/web/id/name?search=${filename}`;

        await message.reply(
          `✅ Paste edited!\nFilename: ${filename}\nPassword: ${password}\n\nURL:\n${url}`
        );
      } catch (error) {
        await message.reply(`❌ Failed to edit paste: ${error.message}`);
      }
    } else {
      const content = args.join(" ");
      const password = randomPassword();

      const postData = {
        filename: `${password}.html`,
        password,
        content,
      };

      try {
        await axios.post(
          "https://liveyourweb.vyturex.com/",
          postData,
          {
            headers: {
              accept: "*/*",
              "accept-language": "en-US,en;q=0.9,vi;q=0.8",
              "content-type": "application/json",
              origin: "https://liveyourweb.vyturex.com",
              priority: "u=1, i",
              referer: "https://liveyourweb.vyturex.com/",
              "sec-ch-ua": `"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"`,
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": `"Windows"`,
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
              "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
            },
          }
        );

        const url = `https://liveyourweb.vyturex.com/web/id/name?search=${password}.html`;

        await message.reply(
          `✅ Paste created!\nFilename: ${password}.html\nPassword: ${password}\n\nURL:\n${url}`
        );
      } catch (error) {
        await message.reply(`❌ Failed to post paste: ${error.message}`);
      }
    }
  },
};
