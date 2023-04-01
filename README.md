# Cactus Bot

## Overview

<img src="cactus.png" height="100">

This is a Discord bot for the Tucsonians Discord server.

## Development

### Local Development Setup (Unix/MacOS)

1. Make Discord bot with all message permissions and [message intent](https://discordpy.readthedocs.io/en/stable/intents.html).
2. [Invite the bot](https://discordpy.readthedocs.io/en/stable/discord.html#inviting-your-bot) to the desired Discord channel with message permissions.
3. Make a Google Cloud account, [enable Google Calendar API](https://developers.google.com/calendar/api/quickstart/python#enable_the_api), and create an [OAuth 2.0 Client ID](https://developers.google.com/calendar/api/quickstart/python#authorize_credentials_for_a_desktop_application) for this application. Ensure that the OAuth consent screen includes the non-sensitive `.../auth/calendar.calendarlist.readonly` scope added.
4. Download the OAuth 2.0 Client ID JSON into a file named `credentials.json` in the root directory of this project.
5. Create a `.env` file with the following variables defined:
    - DISCORD_TOKEN - Token for bot created from discord developer portal
    - DISCORD_CHANNEL_ID - Channel ID that bot will be posting in
    - CALENDAR_ID - ID of the Google Calendar that the bot will be viewing events on
    - CALENDAR_TOKEN_PORT - Port of the verification server for creating API token - this should be 0 unless using Windows with WSL.
6. Activate the python environment with `source env/bin/activate`
7. Install required dependencies with `pip install -r requirements.txt`
8. Run the bot with `python3 main.py`
9. On the first run, you will get a prompt to sign into your google account. Make sure this account is added to the desired calendar. This step creates `token.json` in your directory.

### Local Development Setup (Windows)

1. [Install WSL](https://learn.microsoft.com/en-us/windows/wsl/install) and clone project into WSL.
2. Follow remaining steps from the Unix setup instructions.
3. If you get an `Unable to connect` warning after the token creation step, find the port in the URL (URL should start with `localhost:<port>`) then change the CALENDAR_TOKEN_PORT environment variable to that port. Rerun `python main.py` after fixing this and go through the token creation process again.

## Misc

Hehe hoohoo haha

