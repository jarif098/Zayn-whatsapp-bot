const Canvas = require('canvas');
const axios = require('axios');

module.exports = {
  name: 'rank',
  version: "1.0",
  author: "JARiF",
  description: 'Show your rank, level, and message count with a cyberpunk style rank card',
  usage: 'rank [@user]',
  aliases: ['level', 'lvl'],
  role: 0,
  cooldown: 5,
  category: 'UTILITY',

  async execute({ sock, msg, userData }) {
    try {
      const groupId = msg.key.remoteJid;
      const senderJid = msg.key.participant || msg.key.remoteJid;
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const targetJid = mentionedJid || senderJid;

      const groupMeta = await sock.groupMetadata(groupId);
      const participants = groupMeta.participants || [];

      const users = participants.map(p => {
        const id = `${groupId}_${p.id}`;
        const user = userData.find(u => u.id === id);
        return {
          jid: p.id,
          msgCount: user?.data?.msgCount || 0,
          pushName: p.notify || p.id.split('@')[0],
        };
      });

      users.sort((a, b) => b.msgCount - a.msgCount);

      const rankIndex = users.findIndex(u => u.jid === targetJid);
      const userRank = rankIndex !== -1 ? rankIndex + 1 : "N/A";
      const userDataEntry = users[rankIndex] || {
        msgCount: 0,
        pushName: targetJid.split('@')[0],
      };

      const level = Math.floor(Math.sqrt(userDataEntry.msgCount / 10));

      let avatarImg;
      try {
        let avatarUrl = await sock.profilePictureUrl(targetJid, 'image').catch(() => null);
        if (!avatarUrl || typeof avatarUrl !== 'string') {
          avatarUrl = 'https://i.imgur.com/ZXBtVw7.png';
        }

        const res = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(res.data, 'binary');
        avatarImg = await Canvas.loadImage(buffer);
      } catch (err) {
        console.warn('⚠️ Failed to load profile image, using fallback.', err.message);
        const fallback = await axios.get('https://i.imgur.com/ZXBtVw7.png', { responseType: 'arraybuffer' });
        const buffer = Buffer.from(fallback.data, 'binary');
        avatarImg = await Canvas.loadImage(buffer);
      }

      const width = 700;
      const height = 300;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#0f0c29');
      bgGradient.addColorStop(0.5, '#302b63');
      bgGradient.addColorStop(1, '#24243e');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      function drawNeonBubble(x, y, radius, color) {
        const glow = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
        glow.addColorStop(0, color);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      const bubbleColors = ['#ff00ff', '#00ffff', '#ff0080', '#00ffcc', '#ff0066'];
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = 15 + Math.random() * 20;
        const color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
        drawNeonBubble(x, y, r, color);
      }

      const avatarSize = 128;
      const avatarX = 40;
      const avatarY = (height / 2) - (avatarSize / 2);

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      ctx.shadowColor = '#00fff7';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#00fff7';
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, (avatarSize / 2) - 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      const textStartX = avatarX + avatarSize + 40;
      const lineHeight = 45;

      function neonText(text, x, y, fontSize, color) {
        ctx.font = `${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 5;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;
      }

      const centerY = height / 2;
      const texts = [
        { text: userDataEntry.pushName, fontSize: 36, color: '#00fff7' },
        { text: `Rank: #${userRank}`, fontSize: 28, color: '#ff00ff' },
        { text: `Level: ${level}`, fontSize: 28, color: '#00ff66' },
        { text: `Messages: ${userDataEntry.msgCount}`, fontSize: 24, color: '#ff6600' },
      ];

      const totalTextHeight = texts.length * lineHeight;
      let currentY = centerY - (totalTextHeight / 2) + lineHeight;

      for (const t of texts) {
        neonText(t.text, textStartX, currentY, t.fontSize, t.color);
        currentY += lineHeight;
      }

      const barWidth = 400;
      const barHeight = 30;
      const barX = textStartX;
      const barY = currentY + 10;

      ctx.fillStyle = '#1a0a3a';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const maxMsgCount = users[0]?.msgCount || 1;
      const progress = Math.min(userDataEntry.msgCount / maxMsgCount, 1);

      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);
      ctx.shadowBlur = 0;

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ffff';
      ctx.strokeRect(barX, barY, barWidth, barHeight);

      const buffer = canvas.toBuffer();
      await sock.sendMessage(groupId, {
        image: buffer,
        caption: `🧬 Rank card for @${targetJid.split('@')[0]}`,
        mentions: [targetJid],
      }, { quoted: msg });

    } catch (error) {
      console.error('Rank command error:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Error generating rank card.' }, { quoted: msg });
    }
  }
};
