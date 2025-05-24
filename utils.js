function uid(msg) {
  if (!msg || !msg.key) return null;

  const isGroup = msg.key.remoteJid?.endsWith('@g.us');
  let senderJid = isGroup ? msg.key.participant : msg.key.remoteJid;

  if (!senderJid) return null;

  senderJid = senderJid.split(':')[0];

  const phone = senderJid.split('@')[0];
  return `${phone}@s.whatsapp.net`;
}


const replyHandlers = new Map();

function addGlobalReplyHandler(messageId, handler) {
  if (!messageId || typeof handler !== "function") return;
  replyHandlers.set(messageId, handler);
}


function removeGlobalReplyHandler(messageId) {
  replyHandlers.delete(messageId);
}

async function replyHandler(sock, msg) {
  try {
    const contextInfo = msg.message.extendedTextMessage?.contextInfo;
    if (!contextInfo?.stanzaId) return;

    const repliedMsgId = contextInfo.stanzaId;

    if (replyHandlers.has(repliedMsgId)) {
      const handler = replyHandlers.get(repliedMsgId);
      await handler({ sock, msg });
    }
  } catch (e) {
    console.error("Error in handleReply:", e);
  }
}

module.exports = {
  addGlobalReplyHandler,
  removeGlobalReplyHandler,
  replyHandler,
  uid
};



