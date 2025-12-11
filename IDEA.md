# **IDEA.md — The Vision Behind CommitGoblin**

CommitGoblin is more than a Discord bot.
It is a lightweight, playful, motivational framework designed to strengthen an after-class IT learning community.
The bot encourages *positive habits, teamwork, accountability, and peer recognition* — all wrapped in gamified interactions that feel fun rather than forced.

This document explains the **why** behind each feature category and how they interact to support real learning outcomes.

---

# 🎯 **1. Core Philosophy**

CommitGoblin exists to help students:

* Stay engaged outside the classroom
* Build productive habits (focus sessions, streaks, check-ins)
* Celebrate progress
* Support each other
* Collaborate in teams
* Have fun while learning

Importantly, **everything is voluntary**.
The bot nudges, encourages, and rewards — it does not demand or punish.

---

# 🧱 **2. How Core Commands Build Habits**

### `/checkin` + streaks

Daily check-ins create a *low-barrier ritual* that encourages students to touch the server at least once per day.
Streaks reinforce consistency and reward commitment.

### `/leaderboard`

Public recognition fuels friendly competition without pressure.
By ranking coins, streaks, or check-ins, students see that activity is visible and valued.

### `/motivate`

Short, lightweight boosts to morale — especially helpful on difficult project days or long evenings.

### `/info`, `/ping`, and `/balance`

These provide clarity, transparency, and easy access to personal progress metrics.

**Learning impact:**
These commands establish routine, increase server activity, and give students repeated micro-rewards for showing up.

---

# 🤝 **3. Teams: Collaboration & Ownership**

The team system turns the server into a living project ecosystem.

### Students can:

* Form teams for project work (`/team-create`)
* Join existing teams (`/team-join`)
* Track team performance (`/team-leaderboard`)
* Maintain a team identity via descriptions, names, and membership
* Manage their own project groups without admin intervention

### Team creators gain leadership tools:

* Rename the team
* Update descriptions
* Remove inactive members

This fosters:

* Leadership opportunities
* Soft-skill development
* Ownership and responsibility
* Peer-organized project structures

**Learning impact:**
Teams mirror real-world development groups.
Students experience collaboration, communication, and shared goals — all essential for IT careers.

---

# 🛒 **4. Shop & Items: Social Reinforcement and Fun**

Coins earned from daily habits or focus sessions can be spent on items that create **positive social interaction**.

### Example items:

* **Shoutouts:**
  `/use-item shoutout @user note?`
  → promotes encouragement, peer recognition, and gratitude.

* **Roasts:**
  `/use-item roast @optional_target`
  → playful bonding, used responsibly.

* **Tickets:**
  Used for raffles, events, and fun competitions.

* **Cosmetic roles (optional):**
  Light-hearted personalization without affecting performance.

The shop is intentionally **cosmetic and social**, not competitive.
Students earn items by being active, focused, or helpful — not by grinding or unhealthy behavior.

**Learning impact:**
Social reinforcement boosts morale.
Students feel seen, appreciated, and connected — essential for community cohesion.

---

# 🔥 **5. Focus & Pomodoro: Productive Study Habits**

CommitGoblin helps students work effectively outside class.

### `/focus duration`

* Starts a timed session
* Announces when it begins/ends
* Rewards coins if the session is meaningful (15+ minutes)
* Caps rewards at a healthy daily limit

### `/pomodoro`

Runs repeated focus/break cycles, teaching:

* Time management
* Sustainable productivity
* Task chunking

### `/focus-status`

Makes active learners visible, encouraging others to join in.

### Why anti-grind rules?

Because the goal is **healthy habits**, not maximum farming.

**Learning impact:**
Students adopt real-world productivity methods and experience the benefits of sustained focus.

---

# 🛡️ **6. Admin Tools: Positive Reinforcement from Mentors**

Teachers and moderators can reward real achievements:

* Helping others
* Completing project milestones
* Contributing to group work
* Showing leadership
* Participating in events

Using:

```
/admin-give-coins  
/admin-give-item
```

This creates:

* Teacher visibility
* Immediate positive reinforcement
* Celebration of real educational accomplishments

**Learning impact:**
Recognition from mentors is one of the strongest motivators in educational settings.

---

# 📡 **7. Messaging Behavior: Public vs. Private**

CommitGoblin separates *community content* from *utility content* intelligently.

### Public messages:

* Focus start/finish
* Pomodoro announcements
* Shoutouts & roasts
* Team events
* Leaderboards

These fuel the social aspect.

### Ephemeral/private messages:

* Errors
* Shop purchases
* Inventory checks
* Personal stats

These avoid channel clutter and keep things lightweight.

**Learning impact:**
Students receive personalized feedback while the whole server benefits from positive community signals.

---

# 💾 **8. Data & Progress**

All progress is stored locally in `data.json`, including:

* Coins
* Streaks
* Check-in history
* Team membership
* Item inventory
* Focus session data

This ensures:

* Students feel their progress *matters*
* The community grows organically over time
* Teachers can read or back up the data if needed

---

# 🌱 **9. How CommitGoblin Builds a Learning Community**

CommitGoblin creates an ecosystem where:

### Students show up

Check-ins + streaks + leaderboards create gentle momentum.

### Students collaborate

Teams provide structure for project work.

### Students motivate each other

Shoutouts, roasts, team achievements, and public focus status generate social energy.

### Students focus

Timers + rewards encourage productive study habits.

### Students feel recognized

Coins, announcements, and admin rewards highlight meaningful contributions.

### Students stay connected

Daily rituals and public interactions foster community beyond class hours.

---

# 🎓 **10. Intended Outcomes**

CommitGoblin promotes:

* Consistency
* Teamwork
* Peer appreciation
* Focused study routines
* Accountability
* Joyful learning
* Self-motivated engagement

The bot is intentionally not a “serious productivity tool.”
It is a **friendly, fun companion** that supports an already motivated student community.

---

# 🧙 **CommitGoblin Motto**

> *“Small habits, shared effort, big progress.”*
