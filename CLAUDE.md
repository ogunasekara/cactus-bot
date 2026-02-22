# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cactus Bot is a Discord.js v14 bot for the Tucsonians Discord server. It provides event management, a points/gamification system, and utility commands.

## Commands

```bash
# Install dependencies
npm install

# Run the bot
node index.js

# Deploy slash commands to Discord
node deploy-commands.js

# Run tests
npm test
npm run test:watch
npm run test:coverage
```

## Architecture

**Entry point:** `index.js` - Initializes the Discord.js client, dynamically loads all commands from `commands/` subdirectories and all event handlers from `events/`.

**Key systems:**

- **Event Management** — CRUD for server events with a pluggable storage backend. `utilities/event_manager.js` is the business logic layer, `utilities/storage_interface.js` defines the abstract interface, and `utilities/file_storage.js` is the default JSON file implementation.
- **Points System** — Users earn 1 point/minute in voice channels (daily cap: 100). `utilities/cactus_points.js` handles point logic, `utilities/points_timer.js` runs the interval-based awarding, and `events/voiceStateUpdate.js` tracks voice activity.

**Directory layout:**
- `commands/<category>/` — Slash commands organized by feature (calendar, emoji, utility)
- `events/` — Discord.js event handlers (ready, interactionCreate, voiceStateUpdate)
- `utilities/` — Business logic modules
- `data/` — JSON data files (gitignored, auto-generated at runtime)
- `config/` — Bot credentials (`config.json` is gitignored; copy `config_sample.json` to set up)

## Code Style

- **Tabs** for indentation
- **Single quotes**, **semicolons required**
- **Stroustrup** brace style
- **Trailing commas** in multiline
- ESLint config in `.eslintrc.json`

## Testing

Jest with node environment. Tests are in `tests/`. Setup file at `tests/setup.js` provides global mocks. Coverage is collected from `utilities/`, `commands/`, and `events/`.
