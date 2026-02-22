# Cactus Bot

## Overview

<img src="cactus.png" height="100">

A Discord.js v14 bot for the Tucsonians Discord server. It provides event management, a points/gamification system, emoji management, and utility commands.

## Features

- **Event Management** — Create, list, update, and delete server events with rich embeds, optional end times, and location support
- **Points System** — Users earn 1 point per minute in voice channels (daily cap: 100). Includes leaderboard and point checking
- **Emoji Management** — Submit custom emojis with admin approval workflow, slot tracking, and a link to an emoji resizer tool
- **Pluggable Storage** — Abstract storage interface with a default JSON file backend and a database template for easy extension
- **Utility Commands** — Dice rolling, server info, user info, and more

## Commands

| Command | Description |
|---------|-------------|
| `/create-event` | Create a new event with title, start time, and optional details |
| `/events` | List upcoming events (default: next 14 days) |
| `/update-event` | Update an existing event (creator only) |
| `/delete-event` | Delete an event (creator only) |
| `/emoji` | Submit an image to create a custom emoji (admin approved) |
| `/emoji_site` | Link to emoji resizer tool |
| `/slots` | Check available emoji slots |
| `/points check` | Check your or another user's cactus points |
| `/points leaderboard` | View the top 10 users by total points |
| `/roll` | Roll a die with n sides |
| `/ping` | Pong! |
| `/server` | Display server name and member count |
| `/user` | Display username and join date |
| `/eric` | We love you, Eric! |

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Setup

1. [Create a Discord bot](https://discord.com/developers/applications) with appropriate permissions
2. [Invite the bot](https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands) to your Discord server
3. Copy `config/config_sample.json` to `config/config.json` and fill in your bot details:
   - `token`: Your Discord bot token
   - `clientId`: Your Discord application client ID
   - `guildId`: Your Discord server ID
4. Install dependencies: `npm install`
5. Deploy slash commands: `node deploy-commands.js`
6. Start the bot: `node index.js`

### Testing

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Architecture

```
commands/
  calendar/    — Event management commands
  emoji/       — Emoji submission and slot tracking
  utility/     — General-purpose commands
events/        — Discord.js event handlers (ready, interactionCreate, voiceStateUpdate)
utilities/     — Business logic (event manager, points, storage)
data/          — Runtime JSON data files (gitignored)
config/        — Bot credentials (gitignored)
tests/         — Jest test suite
```

Commands and event handlers are dynamically loaded from their directories at startup. The storage layer uses an abstract interface (`StorageInterface`) backed by a JSON file implementation (`FileStorage`), with a database template available for extension.
