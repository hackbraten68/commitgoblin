# **CONTRIBUTING.md — How to Contribute to CommitGoblin**

Thank you for considering contributing to CommitGoblin!
This document outlines how to set up the project, submit improvements, and follow best practices.

---

# 📦 **1. Getting Started**

### **Prerequisites**

* Node.js 18+
* npm or yarn
* A Discord bot token
* A test Discord server for development
* (Optional) SQLite/Postgres if working on DB features

---

# 🛠️ **2. Project Setup**

### Clone the repo:

```bash
git clone https://github.com/<your-org>/commitgoblin.git
cd commitgoblin
```

### Install dependencies:

```bash
npm install
```

### Create `.env` file:

```
DISCORD_TOKEN=your-bot-token-here
COMMITGOBLIN_CHANNEL_ID=optional-channel-id
```

### Start the bot:

```bash
node index.js
```

---

# 📁 **3. Project Structure**

```
commitgoblin/
│
├── index.js               # Main bot logic
├── data.json              # Persistent storage (temporary)
├── assets/                # Images, icons, etc.
├── docs/                  # Documentation files (README, IDEA, VISION)
└── package.json
```

---

# 🧪 **4. Making Changes**

### Follow these guidelines:

* Keep code modular and readable
* Write pure functions when possible
* Avoid hardcoding values (use config)
* Preserve backward compatibility
* Use async/await consistently
* Validate user input to avoid crashes
* Test commands on a private server before pushing

---

# 🧵 **5. Commit Guidelines**

Use clear, descriptive commit messages:

```
feat: add team leaderboard
fix: resolve role expiration bug
refactor: move shop logic into module
docs: update README with new commands
```

---

# 🌱 **6. Feature Contributions**

Before starting work on large features:

1. Open an issue describing your idea
2. Wait for discussion/approval
3. Follow the project architecture
4. Submit a pull request (PR)

### PR Requirements:

* Clear description of your change
* Testing steps
* Updated docs (if applicable)

---

# 🧹 **7. Coding Style**

While CommitGoblin currently has a single-file structure, contributors should progressively move toward:

* Smaller modules
* Clear separation of concerns
* Data helper functions
* Command objects / handler patterns

We aim for readability and maintainability over clever one-liners.

---

# 🔒 **8. Security Considerations**

* Never hardcode tokens
* Validate role permissions
* Sanitize user input
* Do not allow untrusted file writes
* Avoid dangerous permissions (like Administrator)

---

# 🧰 **9. Testing Commands**

Recommended workflow:

1. Run the bot locally
2. Use a separate Discord “dev bot”
3. Test on a private test server
4. Verify:

   * Correct ephemeral/public behavior
   * Error handling
   * Role assignment
   * Leaderboard accuracy
   * Data persistence

---

# 🤝 **10. How to Get Help**

For questions or ideas:

* Open a GitHub issue
* Contact maintainers on Discord
* Join the discussion thread under `#dev-tools`

We’re happy to help you get started contributing!

---

# 🎉 **Thank You**

CommitGoblin grows through community input — both technical and creative.
Your ideas, code, and improvements directly shape the learning experience of many students.

Let’s build something meaningful together.
