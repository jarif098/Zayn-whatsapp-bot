const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

module.exports = {
  name: 'rank',
  version: "1.0",
  author: "TawsiN | JARiF",
  description: 'Generate rank card with level and XP',
  usage: 'l [@user]',
  role: 3,
  cooldown: 5,
  category: 'UTILITY',

  async zayn({ sock, msg, userData }) {
    try {
      const groupId = msg.key.remoteJid;
      const senderJid = msg.key.participant || msg.key.remoteJid;
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const targetJid = mentionedJid || senderJid;

      const groupMeta = await sock.groupMetadata(groupId);
      const participants = groupMeta.participants || [];

      const users = await Promise.all(participants.map(async (p) => {
        const id = `${groupId}_${p.id}`;
        const user = userData.find((u) => u.id === id);
        let pushName = p.id.split('@')[0];

        try {
          const contact = await sock.onWhatsApp(p.id);
          if (contact?.[0]?.notify) pushName = contact[0].notify;
        } catch {}

        return {
          jid: p.id,
          msgCount: user?.data?.msgCount || 0,
          pushName
        };
      }));

      users.sort((a, b) => b.msgCount - a.msgCount);

      const rankIndex = users.findIndex((u) => u.jid === targetJid);
      const userDataEntry = users[rankIndex] || {
        msgCount: 0,
        pushName: targetJid.split('@')[0],
        jid: targetJid,
      };

      const userRank = rankIndex !== -1 ? rankIndex + 1 : 1;
      const level = Math.floor(Math.sqrt(userDataEntry.msgCount / 10));
      const currentXP = userDataEntry.msgCount;
      const requiredXP = (level + 1) * 500;

      let avatarUrl;
      try {
        avatarUrl = await sock.profilePictureUrl(targetJid, 'image');
      } catch {
        avatarUrl = 'https://i.imgur.com/ZXBtVw7.png';
      }

const canvas = createCanvas(1000, 300);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, canvas.width, canvas.height);

const avatar = await loadImage(avatarUrl);
const avatarX = 70;
const avatarY = 70;
const avatarSize = 160;
const avatarRadius = 80;

const neonColors = ['#00ffff', '#ff00ff', '#39ff14', '#ff4500', '#ffcc00'];
const color = neonColors[Math.floor(Math.random() * neonColors.length)];

ctx.beginPath();
ctx.arc(150, 150, avatarRadius + 6, 0, Math.PI * 2);
ctx.strokeStyle = color;
ctx.lineWidth = 8;
ctx.shadowColor = color;
ctx.shadowBlur = 20;
ctx.stroke();
ctx.closePath();

ctx.save();
ctx.beginPath();
ctx.arc(150, 150, avatarRadius, 0, Math.PI * 2);
ctx.closePath();
ctx.clip();
ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
ctx.restore();

ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;

ctx.strokeStyle = color;
ctx.lineWidth = 4;
ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

ctx.fillStyle = color;
ctx.font = 'bold 32px sans-serif';
const displayName = msg.pushName;
ctx.fillText(displayName, 260, 80);

ctx.font = '24px sans-serif';
ctx.fillText(`Level: ${level}`, 260, 130);
ctx.fillText(`XP: ${currentXP} / ${requiredXP}`, 260, 170);
ctx.fillText(`Rank: #${userRank}`, 260, 210);

ctx.fillStyle = '#333';
ctx.fillRect(260, 230, 700, 25);
const progress = Math.min(currentXP / requiredXP, 1);
ctx.fillStyle = color;
ctx.fillRect(260, 230, 700 * progress, 25);


      const buffer = canvas.toBuffer();
      await sock.sendMessage(groupId, {
        image: buffer,
        caption: `🧬 Rank Card for @${targetJid.split('@')[0]}`,
        mentions: [targetJid],
      }, { quoted: msg });

    } catch (err) {
      console.error('Rank card error:', err);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to generate rank card.' }, { quoted: msg });
    }
  }
};
