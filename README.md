# CommitGoblin Bot

Minimal guide to run the Discord bot.

## Docs
- [VISION.md](./VISION.md) — why this bot exists and where it’s headed.
- [DOCS.md](./DOCS.md) — command-by-command reference.
- [CONTRIBUTING.md](./CONTRIBUTING.md) — how to collaborate.
- [IDEA.md](./IDEA.md) — brainstorming and future ideas.

## Quick Start (local)
1) Install Node 18+
2) `npm ci`
3) Create `.env` with:
   - `DISCORD_TOKEN=your_bot_token`
   - `COMMITGOBLIN_CHANNEL_ID=channel_id_for_public_posts`
4) `node index.js`

## Quick Start (Docker Compose)
1) Ensure `.env` has the vars above.
2) `docker compose up -d`
3) Data persists via `data.json` bind mount.

## Deployment Notes
- The bot registers slash commands on startup; after changing commands, restart it.
- Keep `data.json` backed up if you care about coins/inventory.
- For a Pi/low-power box: prefer Docker or systemd with `Restart=always`.

## FAQ
- **Where do public messages go?** To `COMMITGOBLIN_CHANNEL_ID`. If unset, the command channel is used.
- **Why do slash options look outdated?** Discord caches schemas; restart the bot and wait a minute. If still stale, bump an option name temporarily, restart, then revert.
- **Can I change the bot channel later?** Yes—update `COMMITGOBLIN_CHANNEL_ID` and restart.
- **How do I persist data in Docker?** The compose file binds `./data.json` into `/app/data.json`.
- **Which Node version?** Node 18+.
- **What about permissions?** The bot needs scopes `bot` and `applications.commands` and permission to post in the bot channel.
