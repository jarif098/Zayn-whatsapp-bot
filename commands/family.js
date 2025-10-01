const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

// In-memory caches
const avatarCache = new Map();
const metadataCache = new Map();
const profileUrlCache = new Map();

// Configuration
const CONFIG = {
  baseProfileSize: 30, // Base size for small groups
  minProfileSize: 12, // Minimum for large groups
  gapBetweenImages: 8, // Spacing between profiles
  baseMaxImagesPerRow: 10, // Base for small groups
  canvasPadding: 15, // Minimal padding
  adminBorderColor: '#00CC00', // Green for admins
  memberBorderColor: '#444444', // Dark for members
  groupImageSize: 48, // Group image size
  textColor: '#E0E0E0', // Light gray text
  maxCanvasWidth: 1600, // Max width for large groups
  maxCanvasHeight: 6000, // Max height for large groups
  minCanvasWidth: 800, // Min width for small groups
  minCanvasHeight: 600, // Min height for small groups
  statsOffsetY: 50, // Stats placement
  fontName: 'Arial, Roboto, Helvetica, sans-serif', // Clean fonts
  glowColor: '#66CCCC', // Subtle cyan
  glowBlur: 2, // Minimal glow
  fontSizeTitle: 20, // Title size
  fontSizeStats: 14, // Stats size
  maxParticipants: 1024, // Support massive groups
  batchSize: 1, // Minimal batch for rate limits
  retryDelay: 4000, // Delay for retries
  maxRetries: 4, // Retry attempts
  requestTimeout: 3000, // Axios timeout
  backoffMultiplier: 1.8, // Adaptive backoff
  fallbackUrls: [
    'https://placehold.co/150x150',
    'https://dummyimage.com/150x150/000/fff',
  ]
};

module.exports = {
  name: 'family',
  aliases: ["fm"],
  author: 'TawsiN',
  version: '2.0',
  role: 1,
  description: 'Generate a dynamic group portrait with auto-sized images for small and large groups.',
  noPrefix: false,
  category: 'Admin',

  /**
   * Generates a group portrait with dynamic sizing.
   * @param {Object} params - Command parameters
   * @param {Object} params.sock - WhatsApp socket
   * @param {Object} params.msg - Message object
   * @param {string[]} params.args - Command arguments
   * @param {string} params.sender - Sender JID
   * @returns {Promise<void>}
   */
  async zayn({ sock, msg, args, sender }) {
    console.log('Family command config:', JSON.stringify({
      name: this.name,
      aliases: this.aliases,
      author: this.author,
      version: this.version,
      role: this.role,
      description: this.description,
      noPrefix: this.noPrefix,
      category: this.category
    }, null, 2));
    console.log('Family command triggered:', msg.key.id);

    const jid = msg.key.remoteJid;
    try {
      if (!jid.endsWith('@g.us')) {
        console.log('Not a group chat:', jid);
        await sock.sendMessage(jid, { text: '❌ This command only works in group chats.', mentions: [sender] });
        return;
      }

      // Fetch group metadata
      console.log('Fetching group metadata for:', jid);
      let groupMeta = metadataCache.get(jid);
      if (!groupMeta) {
        groupMeta = await sock.groupMetadata(jid).catch(error => {
          console.error('Group metadata error:', error);
          throw new Error('Failed to fetch group metadata');
        });
        metadataCache.set(jid, groupMeta);
      }
      const { participants, subject: groupName } = groupMeta;
      console.log(`Group size: ${participants.length}`);

      // Filter and cap participants
      let participantIds = participants.map(p => p.id).filter(id => id);
      if (participantIds.length > CONFIG.maxParticipants) {
        console.log(`Capping ${participantIds.length} to ${CONFIG.maxParticipants}`);
        await sock.sendMessage(jid, {
          text: `⚠️ Group has ${participantIds.length} members. Showing first ${CONFIG.maxParticipants} only.`,
          mentions: [sender]
        });
        participantIds = participantIds.slice(0, CONFIG.maxParticipants);
      }
      if (!participantIds.length) {
        console.log('No valid participants');
        await sock.sendMessage(jid, { text: '❌ No valid participants found.', mentions: [sender] });
        return;
      }

      // Dynamic scaling based on group size
      const participantCount = participantIds.length;
      const isSmallGroup = participantCount < 10;
      const scaleFactor = Math.max(0.5, Math.min(1, 50 / participantCount));
      const profileSize = Math.max(CONFIG.minProfileSize, CONFIG.baseProfileSize * scaleFactor);
      const maxImagesPerRow = isSmallGroup
        ? Math.max(5, Math.floor(CONFIG.baseMaxImagesPerRow * 1.2))
        : Math.max(8, Math.floor(CONFIG.baseMaxImagesPerRow * scaleFactor));
      console.log(`Profile size: ${profileSize}px, Max images per row: ${maxImagesPerRow}`);

      // Fetch profile images
      console.log('Fetching profile images');
      const profileData = [];
      for (let i = 0; i < participantIds.length; i += CONFIG.batchSize) {
        const batch = participantIds.slice(i, i + CONFIG.batchSize);
        const batchData = await Promise.all(batch.map(id => fetchProfileImage(sock, id).catch(() => null)));
        profileData.push(...batchData.filter(data => data));
      }
      if (!profileData.length) {
        throw new Error('No valid profile images retrieved');
      }

      // Separate admins and members
      const adminIds = participants.filter(p => p.admin).map(p => p.id);
      const admins = profileData.filter(user => adminIds.includes(user.id));
      const members = profileData.filter(user => !adminIds.includes(user.id));
      console.log(`Admins: ${admins.length}, Members: ${members.length}`);

      // Calculate canvas dimensions
      const numRows = Math.ceil((admins.length + members.length) / maxImagesPerRow);
      const canvasWidth = Math.min(
        maxImagesPerRow * (profileSize + CONFIG.gapBetweenImages) - CONFIG.gapBetweenImages + 2 * CONFIG.canvasPadding,
        isSmallGroup ? CONFIG.minCanvasWidth : CONFIG.maxCanvasWidth
      );
      const canvasHeight = Math.min(
        numRows * (profileSize + CONFIG.gapBetweenImages) + 150 + CONFIG.canvasPadding + CONFIG.statsOffsetY,
        isSmallGroup ? CONFIG.minCanvasHeight : CONFIG.maxCanvasHeight
      );
      console.log(`Canvas: ${canvasWidth}x${canvasHeight}px`);

      // Create canvas
      console.log('Creating canvas');
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d');

      // Draw group image
      console.log('Drawing group image');
      const groupImageX = (canvasWidth - CONFIG.groupImageSize) / 2;
      const groupImageY = CONFIG.canvasPadding;
      try {
        const groupImageUrl = await sock.profilePictureUrl(jid, 'image').catch(() => null);
        if (groupImageUrl) {
          const response = await axios.get(groupImageUrl, { responseType: 'arraybuffer', timeout: CONFIG.requestTimeout });
          const groupImage = await loadImage(Buffer.from(response.data));
          ctx.save();
          ctx.beginPath();
          ctx.arc(groupImageX + CONFIG.groupImageSize / 2, groupImageY + CONFIG.groupImageSize / 2, CONFIG.groupImageSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(groupImage, groupImageX, groupImageY, CONFIG.groupImageSize, CONFIG.groupImageSize);
          ctx.restore();

          ctx.beginPath();
          ctx.arc(groupImageX + CONFIG.groupImageSize / 2, groupImageY + CONFIG.groupImageSize / 2, CONFIG.groupImageSize / 2 + 2, 0, Math.PI * 2);
          ctx.strokeStyle = CONFIG.textColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } catch (error) {
        console.warn('Group image failed:', error.message);
      }

      // Draw group name
      console.log('Drawing group name');
      ctx.fillStyle = CONFIG.textColor;
      ctx.font = `${CONFIG.fontSizeTitle}px ${CONFIG.fontName}`;
      ctx.textAlign = 'center';
      ctx.shadowColor = CONFIG.glowColor;
      ctx.shadowBlur = CONFIG.glowBlur;
      ctx.fillText(groupName || 'Group Family', canvasWidth / 2, CONFIG.groupImageSize + CONFIG.canvasPadding + 40);
      ctx.shadowBlur = 0;

      // Draw profile images
      console.log('Drawing profile images');
      let x = CONFIG.canvasPadding;
      let y = CONFIG.groupImageSize + CONFIG.canvasPadding + 60;

      const drawProfileImage = (image, x, y, borderColor) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + profileSize / 2, y + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(image, x, y, profileSize, profileSize);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(x + profileSize / 2, y + profileSize / 2, profileSize / 2 + 1, 0, Math.PI * 2);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      admins.forEach((admin, index) => {
        drawProfileImage(admin.image, x, y, CONFIG.adminBorderColor);
        x += profileSize + CONFIG.gapBetweenImages;
        if ((index + 1) % maxImagesPerRow === 0) {
          x = CONFIG.canvasPadding;
          y += profileSize + CONFIG.gapBetweenImages;
        }
      });

      members.forEach((member, index) => {
        drawProfileImage(member.image, x, y, CONFIG.memberBorderColor);
        x += profileSize + CONFIG.gapBetweenImages;
        if ((index + 1 + admins.length) % maxImagesPerRow === 0) {
          x = CONFIG.canvasPadding;
          y += profileSize + CONFIG.gapBetweenImages;
        }
      });

      // Draw stats
      console.log('Drawing stats');
      const statsText = `Admins: ${admins.length} | Members: ${members.length} | Total: ${admins.length + members.length}`;
      ctx.fillStyle = CONFIG.textColor;
      ctx.font = `${CONFIG.fontSizeStats}px ${CONFIG.fontName}`;
      ctx.textAlign = 'center';
      ctx.shadowColor = CONFIG.glowColor;
      ctx.shadowBlur = CONFIG.glowBlur;
      ctx.fillText(statsText, canvasWidth / 2, y + CONFIG.statsOffsetY);
      ctx.shadowBlur = 0;

      // Send image
      console.log('Sending image');
      const buffer = canvas.toBuffer('image/png', { compressionLevel: 6 });
      if (!buffer || buffer.length === 0) {
        throw new Error('Failed to generate image');
      }
      await sock.sendMessage(jid, {
        image: buffer,
        caption: '🎨 Group Portrait',
        mentions: [sender]
      });

    } catch (error) {
      console.error('Family command error:', error);
      let errorMessage = `❌ Error generating portrait: ${error.message || 'Unknown error'}`;
      if (error.response?.status === 429) {
        errorMessage = '❌ Too many requests to WhatsApp API. Try again later.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = '❌ Failed to connect to fallback server. Check network or DNS.';
      }
      try {
        await sock.sendMessage(jid, { text: errorMessage, mentions: [sender] });
      } catch (sendError) {
        console.error('Failed to send error:', sendError);
      }
    }
  }
};

/**
 * Fetches a single profile image with retries.
 * @param {Object} sock - WhatsApp socket
 * @param {string} id - Participant ID
 * @param {number} retries - Retry attempts
 * @param {number} delay - Retry delay in ms
 * @returns {Promise<{id: string, image: Object}>}
 */
async function fetchProfileImage(sock, id, retries = CONFIG.maxRetries, delay = CONFIG.retryDelay) {
  if (avatarCache.has(id)) {
    console.log(`Cached avatar for ${id}`);
    return { id, image: avatarCache.get(id) };
  }
  console.log(`Fetching avatar for ${id}, retries: ${retries}`);
  try {
    let avatarUrl = profileUrlCache.get(id) || await sock.profilePictureUrl(id, 'image').catch(() => null);
    if (avatarUrl && typeof avatarUrl === 'string') {
      profileUrlCache.set(id, avatarUrl);
    } else {
      throw new Error('No profile picture');
    }
    const response = await axios.get(avatarUrl, {
      responseType: 'arraybuffer',
      timeout: CONFIG.requestTimeout
    });
    if (!response.headers['content-type']?.startsWith('image/') || response.data.length > 5 * 1024 * 1024) {
      throw new Error('Invalid image');
    }
    const image = await loadImage(Buffer.from(response.data));
    avatarCache.set(id, image);
    return { id, image };
  } catch (error) {
    if (error.response?.status === 429) {
      console.warn(`Rate limit for ${id}, retrying after ${delay}ms`);
    } else if (error.code === 'ENOTFOUND') {
      console.warn(`DNS error for ${id}:`, error.message);
    }
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchProfileImage(sock, id, retries - 1, delay * CONFIG.backoffMultiplier);
    }
    for (const fallbackUrl of CONFIG.fallbackUrls) {
      try {
        const response = await axios.get(fallbackUrl, {
          responseType: 'arraybuffer',
          timeout: CONFIG.requestTimeout
        });
        const image = await loadImage(Buffer.from(response.data));
        avatarCache.set(id, image);
        return { id, image };
      } catch (fallbackError) {
        console.warn(`Fallback failed: ${fallbackUrl}`, fallbackError.message);
      }
    }
    throw new Error('All fallbacks failed');
  }
}
