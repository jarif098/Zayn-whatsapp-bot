const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = 'AXHkknI02RnaQ0vVJ3FK3pVcoToTlmFK';

module.exports = {
  name: 'soundcloud',
  aliases: ['sc', 'scdl'],
  description: 'Search and download a SoundCloud track by selecting from 5 results',
  usage: '<search query or SoundCloud track URL>',
  role: 1,
  coolDown: 10,
  author: 'JARiF',
  version: '1.2',
  category: 'MEDIA',

  async zayn({ sock, msg, args, zaynReply }) {
    const chatId = msg.key.remoteJid;
    if (!args[0]) {
      return await sock.sendMessage(chatId, { text: 'Please provide a search query or SoundCloud track URL!' });
    }

    const input = args.join(' ').trim();

    try {
      if (input.startsWith('https://soundcloud.com/')) {
        await downloadAndSendTrack(sock, msg, input);
      } else {
        await sock.sendMessage(chatId, { text: 'Searching SoundCloud, please wait...' });

        const searchUrl = `https://api-v2.soundcloud.com/search/tracks?client_id=${CLIENT_ID}&q=${encodeURIComponent(input)}&limit=5`;
        const searchRes = await axios.get(searchUrl);
        const results = searchRes.data.collection;

        if (!results || results.length === 0) {
          return await sock.sendMessage(chatId, { text: 'No results found for your query.' });
        }

        let listMsg = 'Select a track by replying with the number (1-5):\n\n';
        results.forEach((track, i) => {
          listMsg += `${i + 1}. ${track.title} - ${track.user.username}\n`;
        });

        const sentMsg = await sock.sendMessage(chatId, { text: listMsg }, { quoted: msg });

        zaynReply(sentMsg.key.id, async (replyMsg) => {
          if (!replyMsg || !replyMsg.message) return;

          let body = '';
          if (replyMsg.message.conversation) {
            body = replyMsg.message.conversation;
          } else if (replyMsg.message.extendedTextMessage?.text) {
            body = replyMsg.message.extendedTextMessage.text;
          } else {
            await sock.sendMessage(chatId, { text: '❌ Please reply with your selection as text.' }, { quoted: replyMsg });
            return;
          }

          const choice = parseInt(body.trim());
          if (isNaN(choice) || choice < 1 || choice > results.length) {
            return await sock.sendMessage(chatId, { text: '❌ Invalid selection. Please reply with a number between 1 and 5.' }, { quoted: replyMsg });
          }

          const selectedTrack = results[choice - 1];
          const trackUrl = `https://soundcloud.com/${selectedTrack.user.permalink}/${selectedTrack.permalink}`;

          await downloadAndSendTrack(sock, replyMsg, trackUrl);
        });
      }
    } catch (err) {
      console.error('SoundCloud error:', err);
      await sock.sendMessage(chatId, { text: 'Failed to find or download the SoundCloud track. It might be private or unavailable.' }, { quoted: msg });
    }
  }
};

async function downloadAndSendTrack(sock, msg, url) {
  try {
    const chatId = msg.key.remoteJid;

    const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${CLIENT_ID}`;
    const resolveRes = await axios.get(resolveUrl);
    const track = resolveRes.data;

    if (!track || !track.id) throw new Error('Track not found or private.');

    const title = track.title.replace(/[\\/:"*?<>|]+/g, '');
    const tempDir = path.join(__dirname, '..', 'commands', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const streamUrl = track.media?.transcodings?.find(t => t.format.protocol === 'progressive')?.url;
    if (!streamUrl) throw new Error('No progressive stream available for this track.');

    const streamInfoRes = await axios.get(`${streamUrl}?client_id=${CLIENT_ID}`);
    const downloadUrl = streamInfoRes.data.url;

    const filename = path.join(tempDir, `${title}-${Date.now()}.mp3`);
    const writer = fs.createWriteStream(filename);

    const downloadRes = await axios({
      url: downloadUrl,
      method: 'GET',
      responseType: 'stream',
    });

    downloadRes.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const audioBuffer = fs.readFileSync(filename);

    await sock.sendMessage(chatId, {
      audio: audioBuffer,
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`,
    }, { quoted: msg });

    fs.unlinkSync(filename);
  } catch (err) {
    console.error('Download error:', err);
    await sock.sendMessage(msg.key.remoteJid, { text: 'Error downloading the track.' }, { quoted: msg });
  }
}
