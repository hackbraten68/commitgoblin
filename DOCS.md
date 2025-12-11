# CommitGoblin Commands (overview)

Quick reference for the bot’s slash commands and behaviors.

## Core
General utility and stats commands.
- `/ping` — health check.
- `/info` — server info blurb.
- `/motivate` — random motivation.
- `/checkin` — daily streak + coins.
- `/balance` — wallet, streak, check-ins, shoutouts/roasts stats.
- `/leaderboard [type]` — users by coins/streak/checkins.
- `/team-leaderboard [type]` — teams by coins/checkins/streak.

## Teams
Create, join, inspect, and manage teams.
- `/team-create name description?`
- `/team-join name`
- `/team-leave name`
- `/team-info name?` — optional; if omitted, uses your team(s).
- `/team-list`
- `/team-rename old_name new_name` (creator only)
- `/team-set-description name description` (creator only)
- `/team-kick name member` (creator only)

## Shop & Items
Spend coins, manage inventory, and use special items.
- `/shop` — lists items.
- `/buy item amount?` — spends coins, adds to inventory (roles applied immediately if applicable).
- `/my-items` — shows inventory.
- `/use-item item target? note?`
  - `shoutout` requires `target`, optional `note`; posts a styled shoutout and updates give/receive counters.
  - `roast` optionally targets someone else; records give/receive and posts publicly.
  - `ticket` is informational.

## Focus / Pomodoro
Timers with coin rewards and session announcements.
- `/focus duration` — starts a focus timer, posts updates, rewards coins (with daily cap).
- `/focus-stop` — stops focus/pomodoro.
- `/pomodoro work_minutes? break_minutes? rounds?` — runs rounds with start/end notices and rewards.
- `/focus-status` — shows current sessions in the guild.

## Admin
Admin-only utilities for testing or moderation.
- `/admin-give-coins user amount reason?`
- `/admin-give-item user item amount?`

## Messaging Behavior
- Public outputs route to `COMMITGOBLIN_CHANNEL_ID` if set; otherwise they go to the command channel.
- Ephemeral/tooling responses (errors, balance, shop, buys) are private to the user.
- Messages are wrapped in a simple ASCII box; the shoutout/roast cards use their own styling.

## Data
- Stored in `data.json` next to the code. Back it up if coin/inventory data matters.
