# Cactus Bot

## Overview

This is a Discord bot for the Tucsonians Discord server.

## Installation/Running

1. Make Discord bot with all message permissions and message intent.
2. Invite the bot to the desired Discord channel.
3. Make a Google Cloud account, enable Google Calendar API (free to use), and create an OAuth 2.0 Client ID for this application. Ensure that the OAuth consent screen includes the non-sensitive `.../auth/calendar.calendarlist.readonly` scope added.
4. Download the OAuth 2.0 Client ID JSON into a file named `credentials.json` in the root directory of this project.
5. Create a `.env` file with the following variables defined:
    - DISCORD_TOKEN - Token for bot created from discord developer portal
    - DISCORD_CHANNEL_ID - Channel ID that bot will be posting in
    - CALENDAR_ID - ID of the Google Calendar that the bot will be viewing events on
6. Activate the python environment with `source env/bin/activate`
7. Run the bot with `python3 main.py`