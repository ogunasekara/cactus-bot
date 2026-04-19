# Cactus Bot

## Overview

<img src="cactus.png" height="100">

This is a Discord bot for the Tucsonians Discord server. The bot provides event management functionality with local file-based storage.

## Features

- **Event Management**: Create, list, update, and delete events
- **Local Storage**: Events are stored locally in JSON files
- **User Permissions**: Users can only modify events they created
- **Rich Embeds**: Beautiful Discord embeds for event display

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Local Development Setup

1. [Create a Discord bot](https://discord.com/developers/applications) with appropriate permissions
2. [Invite the bot](https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands) to your Discord server
3. Copy `config/config_sample.json` to `config/config.json` and fill in your bot details:
   - `token`: Your Discord bot token
   - `clientId`: Your Discord application client ID
   - `guildId`: Your Discord server ID
4. Install dependencies: `npm install`
5. Deploy slash commands: `node deploy-commands.js`
6. Start the bot: `node index.js`

## Docker Setup

### Prerequisites

- Docker
- Docker Compose (v2, `docker compose`)

### Run with Docker

1. Copy `config/config_sample.json` to `config/config.json` and fill in:
   - `token`
   - `clientId`
   - `guildId`
2. Build the image:
   - `docker compose build`
3. Deploy slash commands (run when commands change):
   - `docker compose run --rm bot npm run deploy-commands`
4. Start the bot:
   - `docker compose up -d`
5. View logs:
   - `docker compose logs -f bot`
6. Stop the bot:
   - `docker compose down`

Notes:
- Event data is persisted in `./data` on your host.
- `config/config.json` is mounted read-only into the container.

### Makefile Shortcuts

You can use the included `Makefile` for common Docker operations:

- `make build` - Build the Docker image
- `make up` - Start the bot in background
- `make logs` - Follow bot logs
- `make deploy` - Deploy slash commands
- `make ps` - Show container status
- `make restart` - Restart the bot container
- `make down` - Stop and remove the container

### Available Commands

- `/events` - List upcoming events (default: next 14 days)
- `/create-event` - Create a new event
- `/update-event` - Update an existing event
- `/delete-event` - Delete an event

## Architecture

The bot uses a modular architecture with:
- **EventManager**: Core event management logic
- **FileStorage**: Local JSON file storage backend
- **StorageInterface**: Abstract interface for extensible storage backends
- **Slash Commands**: Discord.js slash command system
