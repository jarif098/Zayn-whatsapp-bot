module.exports = {
  connected: "✅ ZAYN WP BOT PROJECT TURNED ON",
  connectionClosed: "⚠️ Connection closed. You are logged out.",
  scanQr: "📱 Scan this QR code to connect.",
  unknownCommand: "❌ {command} Does not exist. Type {prefix}help to see all the available commands.",
  justPrefixTyped: "❌ Type {prefix}help to see all commands.",
  noPermission: "❌ You don’t have permission to use this command.",
  errorExecuting: "⚠️ Error executing command: {command}",

  devOnly: "❌ Only the bot's dev can use this command \"{command}\"",
  adminOnly: "❌ Only the bot's admins and devs can use this command \"{command}\"",

  cooldown: "⏱ | Cooldown remaining. Please wait {time}s",
  restartingBot: "✅ Restarted successfully in {time} seconds.",

  inboxNotAllowed: "🚫 This bot does not work in inbox.\n\n📞 Contact admin: {admin}\n💬 Join support chat: {support}",

  
  format(text, params = {}) {
    return text.replace(/{(\w+)}/g, (_, key) => params[key] ?? `{${key}}`);
  }
};
