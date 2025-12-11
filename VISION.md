# **VISION.md — CommitGoblin Long-Term Roadmap**

CommitGoblin is a community-building and motivation assistant for learning-focused Discord servers.
Its long-term vision is to evolve into a flexible, extensible platform that encourages:

* **Healthy study routines**
* **Peer collaboration**
* **Positive reinforcement**
* **Gamified learning**
* **Community identity**

This roadmap outlines upcoming development goals, grouped by theme.

---

# 🎯 **1. Community & Social Systems**

### **Shoutout Network**

* Improve shoutout cards with richer embeds
* Add a public shoutout archive channel
* Add monthly “Most Helpful” awards

### **Reputation System**

* XP-based reputation separate from coins
* Earned through:

  * Giving/receiving shoutouts
  * Helping in support channels
  * Completing focus milestones
* Reputation unlocks cosmetic perks

### **Achievement Badges**

* Milestone recognition for:

  * 7-day streak
  * 30 focus sessions
  * Completing a team project
  * Participating in events
* Display on `/profile` command

---

# 🧠 **2. Learning & Productivity Tools**

### **Focus Analytics**

* Weekly and monthly summaries
* Focus heatmaps
* Leaderboards for total focus minutes

### **Study Groups**

* Temporary focus groups
* Shared timers (team Pomodoro)
* “Study Together” channels activated automatically

### **Task Notes / Personal Goals**

* Private note storage per user (local JSON or optional DB)
* `/goals`, `/goal-add`, `/goal-check`

---

# 🧩 **3. Team Dynamics**

### **Project Tracking**

* Teams can register project names and milestones
* `/team-status` showing progress
* Point rewards for milestone completions

### **Team Competitions**

* Weekly or monthly team events
* Points earned from focus, check-ins, or set challenges

### **Team Roles**

* Automatic assignment of:

  * Team Leader
  * Contributor
  * MVP

---

# 🛒 **4. Shop Evolution**

### **Cosmetic Expansion**

* More time-limited roles
* Profile banners
* Emoji unlocks

### **Consumable Items**

* “Boosts” for temporary effects:

  * +1 coin bonus on next check-in
  * Double-focus reward for one session (within daily limits)

### **Raffle System**

* `/raffle-open`, `/raffle-enter`, `/raffle-draw`
* Ticket tracking and event announcements

---

# 🔐 **5. Backend & Infrastructure Improvements**

### **Database Migration**

* Move from `data.json` → SQLite or Postgres
* Add backup/migration tools
* Improve concurrency and data integrity

### **Modular Architecture**

* Split commands into modules
* Easier contribution and maintenance

### **Configuration File**

* Environment-based config system
* More flexible channel & role assignment

---

# 🤖 **6. AI-Assisted Features (Optional)**

### **AI Mentor**

* Students can ask for help with:

  * Code debugging
  * Terminology explanations
  * Study tips

### **AI Summaries**

* Summarize long team discussions
* Provide notes after events

*(Add-on; not required for the core experience.)*

---

# 🌍 **7. Multi-Server Support**

### **Guild Profiles**

* Each server has its own configuration
* Per-guild shop items
* Per-guild leaderboards

---

# 🎉 **8. Event Framework**

### **Seasonal Events**

Examples:

* “Focus February”
* “Hacktober Study Marathon”
* “Back-to-School XP Sprint”

### **Quests**

* Daily and weekly quests
* Team quests
* Randomized challenges

---

# 🧭 **Vision Summary**

CommitGoblin aims to be:

* A **study companion**
* A **community motivator**
* A **gamification engine**
* A **collaboration catalyst**
* A **safe, positive presence** in the server

As the community grows, so will the bot — always with learning and connection at its core.
