# Zayn WhatsApp Bot 🤖

A modular, easy-to-extend WhatsApp bot built on Baileys (Node.js) with:

- Role-based command permissions  
- Alias support for commands  
- Cooldowns per command per user  
- Group-only and private-only command control  
- Reply and reaction handlers  
- Dynamic prefix support  
- Unified message helper functions (reply, unsend, stream)  

---

## Features

- **Auto command loading:** Every `.js` file inside `commands/` is treated as a command automatically.  
- **Command metadata:** Each command exports metadata like `name`, `aliases`, `version`, `role`, `description`, `cooldown`, etc.  
- **Role-based access control:** Roles range from everyone to admin and superadmin.  
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
  author: "Jarif",
  cooldown: 5,           // seconds
  role: 0,               // 0 = everyone, 1 = admin, 2 = superadmin
  description: "Ping the bot to check if it's alive",
  group: false,          // true if command is group-only
  private: false,        // true if command is private-only
  execute: async (message, args, context) => {
    await message.reply("Pong!");
  }
};
