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

- Node.js v16 or higher installed locally (for testing and deployment).  
- A WhatsApp account to scan the QR code and connect the bot.  
- A GitHub or GitLab repository with your bot code (optional but recommended for deployment).

---

## Installation (Local Development)

1. Clone the repo:

    ```bash
    git clone https://github.com/yourusername/zayn-whatsapp-bot.git
    cd zayn-whatsapp-bot
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Run the bot:

    ```bash
    node index.js
    ```

4. Scan the QR code that appears in the terminal with your WhatsApp mobile app to authorize the bot.

---

## Command Structure

Each command is a separate `.js` file inside the `commands/` folder exporting an object:

```js
module.exports = {
  name: "ping",
  aliases: ["p"],
  version: "1.0",
  author: "JARiF",
  cooldown: 5,           // seconds
  role: 0,               // 0 = everyone, 1 = admin, 2 = superadmin/dev
  description: "Ping the bot to check if it's alive",
  group: false,          // true if command is group-only
  private: false,        // true if command is private-only
  zayn: async function(message, args, context) => {
    await message.reply("Pong!");
  }
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
### Step 1: Handling WhatsApp QR Code for Login

Render runs your bot in the cloud where you cannot scan a QR code interactively like local development. To handle this:

- **Option 1: Use persistent session file**

  Your bot saves WhatsApp session data (usually a JSON or a folder) after the first successful QR scan locally. Commit this session data (or upload it securely) to your repo so Render can reuse it and connect automatically.

- **Option 2: Use persistent storage**

  Use Render's persistent disks or environment variable secrets to store and load session credentials safely across restarts.

- **Option 3: Manual QR scanning**

  Temporarily run your bot locally, scan the QR code, save the session file, then deploy the bot with this saved session file to Render.

> **Note:** Without a valid session, your bot will keep showing a QR code in logs which cannot be scanned on Render’s server.

