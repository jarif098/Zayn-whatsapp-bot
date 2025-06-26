# Zayn WhatsApp Bot 

A modular, easy-to-extend WhatsApp bot built on Baileys (Node.js) with:

- Role-based command permissions  
- Alias support for commands  
- Cooldowns per command per user  
- Group-only bot
- Reply and reaction handlers  
- Dynamic prefix support  

---

## Features

- **Command metadata:** Each command exports metadata like `name`, `aliases`, `version`, `role`, `description`, `cooldown`, `isPrefix`.  
- **Role-based access control:** Roles range from everyone to admin and dev/superadmin.  
- **Cooldown system:** Per-user cooldowns for commands to prevent spam.  
- **Group and private chat control:** Commands can be limited to groups or private chats only.  
- **Reply-based interactions:** Commands can listen to user replies, enabling multi-step conversations or games.  
- **Message helper methods:** Convenient helpers like `message.reply()`, `message.unsend()`, and `message.stream()` to simplify sending and managing messages.

---

## Prerequisites

- Node.js v20 or higher installed locally (for testing and deployment).  
- A WhatsApp account to scan the QR code and connect the bot.  
- A GitHub or GitLab repository with your bot code (optional but recommended for deployment).

---

## Installation (Local Development)

1. Clone the repo:

    ```bash
    git clone https://github.com/jarif098/Zayn-whatsapp-bot.git
    cd Zayn-whatsapp-bot
    ```

2. Install dependencies:

    ```bash
    npm install --force
    ```

3. Run the bot:

    ```bash
    node index.js
    ```

4. Scan the QR code that appears in the terminal with your WhatsApp mobile app to authorize the bot. or use https://paircode.raktakto.com/ this site to get paircode

---

## Command Structure

Each command is a separate `.js` file inside the `commands/` folder exporting an object:

```js
module.exports = {
  // Command name used to trigger this command
  name: 'example',

  // Alternative names (aliases) to trigger the same command
  aliases: ['ex'],

  // Author of the command
  author: "JARiF",
 
  //version of the command
  version: "1.0",

  // Role required to use the command (0 = everyone)
  role: 0,

  // Short description shown in help or command list
  description: 'example - Example command with reply and reaction',

  // Whether the command can be used without prefix (false means prefix is required)
  noPrefix: false,

  //category
  category: "DEVELOPER",

  /**
   * Main async function executed when command is called.
   * sock - WhatsApp socket connection object
   * msg - Incoming message object
   * message - Incoming message object (alias for msg)
   * args - Command arguments array
   * api - API object (optional, unused here)
   * sender - Sender's WhatsApp ID
   * config - Configuration object (optional, unused here)
   * commands - Loaded commands object (optional, unused here)
   * addReply - Function to add reply listeners (optional, unused here)
   * zaynReply - Function to listen for replies or reactions linked to a message ID
   * removeReply - Function to remove the reply listener after finishing interaction
   * userMoney - User money data (optional, unused here)
   * prefixesData - Prefixes data (optional, unused here)
   * groupSettings - Group-specific settings (optional, unused here)
   * SaveData - Function to save data (optional, unused here)
   * GetData - Function to retrieve data (optional, unused here)
   */
  zayn: async function ({ sock,
    msg,
    message, 
    args,
    api,
    sender,
    config,
    commands,
    addReply,
    zaynReply,
    removeReply,
    userMoney,
    prefixesData,
    groupSettings,
    SaveData,
    GetData }) {
    // Get the chat ID (could be group or individual chat)
    const jid = msg.key.remoteJid;

    // Send initial question message asking for user's favorite color,
    // mentioning the sender so they get notified
    const questionMsg = await sock.sendMessage(jid, {
      text: `Hi! What is your favorite color?\nReply with your answer or react with 👍 to confirm you like this command.`,
      mentions: [sender],
    });

    // Listen for a reply message to the question message
    zaynReply(questionMsg.key.id, async (replyMsg) => {
      // Extract text from reply message, supporting normal or extended text messages
      const text =
        replyMsg.message?.conversation ||
        replyMsg.message?.extendedTextMessage?.text ||
        '';

      // If no text found in reply, notify user and return early
      if (!text) {
        await replyMsg.reply("I didn't get your answer. Please try again.");
        return;
      }

      // Respond acknowledging the received favorite color
      await replyMsg.reply(`Nice! Your favorite color is "${text}". Thanks for sharing!`);

      // Remove this reply listener to clean up resources
      removeReply(questionMsg.key.id);
    });

    // Listen for reactions to the question message
    zaynReply(questionMsg.key.id, async (reactionMsg) => {
      // Extract the reaction emoji text
      const emoji = reactionMsg.message?.reactionMessage?.text;

      // If user reacted with thumbs up emoji
      if (emoji === '👍') {
        // Send a thank you message mentioning the user
        await sock.sendMessage(jid, {
          text: 'Thanks for reacting with 👍!',
          mentions: [sender],
        });

        // Remove the reply listener since interaction is finished
        removeReply(questionMsg.key.id);
      }
    });
  },
};

```

### RENDER HOSTING
### Create a new Web Service on Render

1. Go to [https://render.com/](https://render.com/) and sign up or log in.

2. Click **New** → **Web Service**.

3. Connect your GitHub/GitLab/Bitbucket repository and select your bot repo.

4. Configure the service:

   - **Name:** Choose a name for your bot service.
   - **Region:** Choose a region close to you.
   - **Branch:** Choose the branch (usually `main` or `master`).
   - **Runtime:** Select `Node`.
   - **Build Command:** Leave blank or enter `npm install`.
   - **Start Command:** `npm start` (or `node index.js` if you don’t have a start script).
   - **Environment:** Add environment variables here if your bot requires any (e.g., API keys).
   - **Instance Type:** Choose a free tier or paid instance depending on your needs.

5. Click **Create Web Service**.

---
### Handling WhatsApp QR Code for Login

Render runs your bot in the cloud where you cannot scan a QR code interactively like local development. To handle this:

- **Option 1: Use persistent session file**

  Your bot saves WhatsApp session data (usually a JSON or a folder) after the first successful QR scan locally. Commit this session data (or upload it securely) to your repo so Render can reuse it and connect automatically.

- **Option 2: Use persistent storage**

  Use Render's persistent disks or environment variable secrets to store and load session credentials safely across restarts.

- **Option 3: Manual QR scanning**

  Temporarily run your bot locally, scan the QR code, save the session file, then deploy the bot with this saved session file to Render.

> **Note:** Without a valid session, your bot will keep showing a QR code in logs which cannot be scanned on Render’s server.

