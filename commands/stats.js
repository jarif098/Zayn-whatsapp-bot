const { createCanvas, CanvasRenderingContext2D } = require('canvas');
const fs = require('fs');

const pastelColors = [
  '#FFD6E8', '#D6EFFF', '#FFF5BA', '#D7FFD6',
  '#FAD9FF', '#FFE4C4', '#E6E6FA', '#FFDEAD',
  '#BFFCC6', '#C9C9FF'
];

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

module.exports = {
  name: "stats",
  aliases: ["topcommands", "mostused"],
  version: "1.2",
  author: "JARiF",
  usage: "stats",
  role: 1,
  cooldown: 10,
  description: "See the most used commands.",
  guide: "",

  async execute({ message, userData }) {
    const globalEntry = userData.find(u => u.id === 'globalCommandLogs');
    const logs = globalEntry ? globalEntry.data.commandLogs : {};

    if (Object.keys(logs).length === 0) {
      return message.reply("No command usage data available.");
    }

    const top = Object.entries(logs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const commandUsage = Object.fromEntries(top);

    const width = 1000;
    const height = 700;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fffafc';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = `rgba(255,182,193,${Math.random() * 0.05})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff69b4';
    ctx.font = 'bold 48px "Comic Sans MS", cursive';
    ctx.shadowColor = '#fdaec5';
    ctx.shadowBlur = 15;
    ctx.fillText('Command Usage Stats', width / 2, 80);
    ctx.shadowBlur = 0;

    ctx.font = '24px "Comic Sans MS", cursive';
    ctx.fillStyle = '#c71585';
    ctx.fillText('Which commands are the most popular?', width / 2, 120);

    const values = Object.values(commandUsage);
    const total = values.reduce((a, b) => a + b, 0);

    const centerX = width / 2;
    const centerY = 420;
    const radius = 250;

    let startAngle = -Math.PI / 2;

    Object.entries(commandUsage).forEach(([cmd, count], i) => {
      const sliceAngle = (count / total) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, radius);
      gradient.addColorStop(0, pastelColors[i % pastelColors.length]);
      gradient.addColorStop(1, '#ffffff');

      ctx.fillStyle = gradient;
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 8;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffb6c1';
      ctx.stroke();

      const midAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(midAngle) * (radius + 40);
      const labelY = centerY + Math.sin(midAngle) * (radius + 40);

      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(midAngle) * radius, centerY + Math.sin(midAngle) * radius);
      ctx.lineTo(labelX, labelY);
      ctx.strokeStyle = '#f49ac2';
      ctx.lineWidth = 2;
      ctx.stroke();

      const percent = ((count / total) * 100).toFixed(1) + '%';

      ctx.fillStyle = '#7d3f59';
      ctx.font = 'bold 20px "Comic Sans MS", cursive';
      ctx.textAlign = midAngle > Math.PI / 2 && midAngle < (3 * Math.PI) / 2 ? 'right' : 'left';
      ctx.textBaseline = 'middle';

      ctx.fillText(`${cmd} (${percent})`, labelX, labelY);

      startAngle = endAngle;
    });

    ctx.lineWidth = 10;
    ctx.strokeStyle = '#f8c1d7';
    ctx.shadowColor = '#ffb6c1';
    ctx.shadowBlur = 25;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f49ac2';
    ctx.strokeRect(25, 25, width - 50, height - 50);

    const buffer = canvas.toBuffer('image/png');
    const filename = './commands/tmp/stats.png';
    fs.writeFileSync(filename, buffer);

    let reply = `📊 *Top Commands Usage in the Last 7 Days* 📅\n\n`;
    top.forEach(([name, count], i) => {
      reply += `${i + 1}. \`${name}\` — *${count} uses*\n`;
    });

    await message.stream(filename, {
      caption: reply.trim(),
    });
  }
};
