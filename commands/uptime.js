const os = require("os");
const process = require("process");
const fs = require("fs");
const pkg = require('../package.json');
const { createCanvas } = require('canvas');

module.exports = {
  name: "uptime",
  version: "1.0",
  author: "JARiF",
  description: "Show detailed info about the bot and server",
  usage: "uptime",
  aliases: ["upt", "status", "aboutbot"],
  role: 0,
  cooldown: 5,
  category: "UTILITY",

  async zayn({ sock, msg, config, message }) {
    try {
      const uptime = os.uptime();
      const uptimeFormatted = formatUptime(uptime);
      const cpus = os.cpus();
      const cpuModel = cpus[0].model;
      const cpuCores = cpus.length;
      const loadAvg = os.loadavg()[0].toFixed(2);
      const totalMem = os.totalmem() / 1024 / 1024;
      const freeMem = os.freemem() / 1024 / 1024;
      const usedMem = totalMem - freeMem;
      const ramPercent = usedMem / totalMem;
      const platform = `${os.platform()} (${os.arch()})`;
      const nodeVersion = process.version;
      const hostname = os.hostname();

      // Canvas 
      const width = 1200;
      const height = 700;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // COLORS
      const bg = '#0b0f1c';
      const glow = '#00ffe1';
      const cutePink = '#66ffff';
      const cuteBlue = '#66ffff';
      const softWhite = '#eeeeee';

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Glow
      ctx.shadowColor = glow;
      ctx.shadowBlur = 60;
      ctx.fillStyle = '#111a25';
      roundRect(ctx, 80, 50, 1040, 580, 40, true, false);

      // Header
      ctx.shadowBlur = 0;
      ctx.fillStyle = cuteBlue;
      ctx.font = "bold 50px 'Segoe UI', sans-serif";
      ctx.fillText(`${config.botName} | ${pkg.version}`, 120, 140);


      // bubble
      ctx.font = "bold 20px sans-serif";
      const hostText = `HOST: ${hostname}`;
      const bubbleWidth = ctx.measureText(hostText).width + 40;
      ctx.fillStyle = cutePink;
      const newX = 900; 
       const newY = 90; 

    roundRect(ctx, newX, newY, bubbleWidth, 40, 12, true, false);
    ctx.fillStyle = '#111a25';
    ctx.fillText(hostText, newX + 20, newY + 28);


      const info = [
        ["Uptime", uptimeFormatted],
        ["CPU", `${cpuModel} (${cpuCores} cores)`],
        ["Load Avg (1 min)", loadAvg],
        ["RAM Usage", `${usedMem.toFixed(1)} MB / ${totalMem.toFixed(1)} MB (${(ramPercent * 100).toFixed(2)}%)`],
        ["Platform", platform],
        ["Node.js", nodeVersion],
        ["Hostname", hostname]
      ];

      ctx.font = "22px 'Segoe UI', sans-serif";
      info.forEach((item, i) => {
        ctx.fillStyle = cuteBlue;
        ctx.fillText(item[0], 130, 210 + i * 50);
        ctx.fillStyle = softWhite;
        ctx.fillText(item[1], 400, 210 + i * 50);
      });

      drawCircularRam(ctx, 900, 300, 100, ramPercent);


const loadAvgRaw = os.loadavg()[0];
const loadAvg2 = loadAvgRaw.toFixed(2);

const loadPercent = Math.min(loadAvgRaw / cpuCores, 1); 
const loadPercent100 = loadPercent * 100;          

const loadPercentText = loadPercent100.toFixed(2);

drawProgressBar(
  ctx,
  150,
  570,
  800,
  30,
  loadPercent,    
  "🧠 CPU Load",
  `(${loadAvg2} | ${loadPercentText}%)`,
  cuteBlue
);


      const outPath = './commands/tmp/up.png';
      const out = fs.createWriteStream(outPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      await new Promise((res) => out.on('finish', res));

      const release = os.release();
      const totalMemMB = totalMem.toFixed(2);
      const freeMemMB = freeMem.toFixed(2);
      const usedMemMB = usedMem.toFixed(2);
      const botName = config.botName;
      const botVersion = pkg.version;

      const text =
        `*${botName}* - Version: ${botVersion}\n` +
        `Uptime: ${uptimeFormatted}\n` +
        `Host Info:\n` +
        `  • Hostname: ${hostname}\n` +
        `  • Platform: ${platform}\n` +
        `  • OS Release: ${release}\n` +
        `CPU:\n` +
        `  • Model: ${cpuModel}\n` +
        `  • Cores: ${cpuCores}\n` +
        `Memory:\n` +
        `  • Used: ${usedMemMB} MB\n` +
        `  • Free: ${freeMemMB} MB\n` +
        `  • Total: ${totalMemMB} MB\n` +
        `Node.js Version: ${nodeVersion}`;

     await message.stream(outPath, {
  caption: text,
  mentions: [msg.sender],
  quoted: msg
});

    } catch (err) {
      console.error("botinfo command error:", err);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Failed to generate bot status.' }, { quoted: msg });
    }

    function formatUptime(seconds) {
      const d = Math.floor(seconds / (3600 * 24));
      const h = Math.floor((seconds % (3600 * 24)) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      return `${d}d ${h}h ${m}m ${s}s`;
    }

    function roundRect(ctx, x, y, w, h, r, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    }

    function drawCircularRam(ctx, x, y, radius, percent) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1f2f3f';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, -Math.PI / 2, (2 * Math.PI * percent) - Math.PI / 2);
      ctx.strokeStyle = '#66ffff';
      ctx.lineWidth = 20;
      ctx.shadowColor = '#66ffff';
      ctx.shadowBlur = 30;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#eeeeee';
      ctx.font = "20px sans-serif";
      ctx.fillText("RAM Usage", x - 55, y - 10);
      ctx.font = "bold 26px sans-serif";
      ctx.fillText(`${(percent * 100).toFixed(1)}%`, x - 47, y + 25);
    }

    function drawProgressBar(ctx, x, y, w, h, percent, label, value, color) {
      const radius = h / 2;

      ctx.fillStyle = '#eeeeee';
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`${label} ${value}`, x, y - 15);

      ctx.fillStyle = "#222c3c";
      roundRect(ctx, x, y, w, h, radius, true, false);

      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = color;
      roundRect(ctx, x, y, w * percent, h, radius, true, false);
      ctx.shadowBlur = 0;
    }
  },
};
