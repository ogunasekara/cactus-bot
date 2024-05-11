# Cactus Bot

## Overview

<img src="cactus.png" height="100">

This is a Discord bot for the Tucsonians Discord server. The bot relies on a PostgreSQL datastore and utilizes Docker containerization to quickly compose the entire application.

## Development

This bot relies on Docker to run all necessary components. As such, installing [Docker Desktop](https://www.docker.com/products/docker-desktop/) is a pre-requisite for development and deployment.

### Local Development Setup (Unix/MacOS)

1. [Make Discord bot](https://www.pythondiscord.com/pages/guides/pydis-guides/contributing/setting-test-server-and-bot-account/) with all message permissions and [message intent](https://discordpy.readthedocs.io/en/stable/intents.html).
2. [Invite the bot](https://discordpy.readthedocs.io/en/stable/discord.html#inviting-your-bot) to the desired Discord channel with message permissions.
3. Make a Google Cloud account, [enable Google Calendar API](https://developers.google.com/calendar/api/quickstart/python#enable_the_api), and create an [OAuth 2.0 Client ID](https://developers.google.com/calendar/api/quickstart/python#authorize_credentials_for_a_desktop_application) for this application. Ensure that the OAuth consent screen includes the non-sensitive `.../auth/calendar.calendarlist.readonly` scope added.
4. Download the OAuth 2.0 Client ID JSON into a file named `credentials.json` in the root directory of this project.
5. Create a `.env` file with the following variables defined:
    - DISCORD_TOKEN - Token for bot created from discord developer portal
    - DISCORD_CHANNEL_ID - Channel ID that bot will be posting in
    - CALENDAR_ID - ID of the Google Calendar that the bot will be viewing events on
6. Switch to the virtual environment with `python -m venv env && source env/bin/activate`
7. Install the local dependencies into the environment with `pip install -r requirements.txt`
8. If you do not have `token.json` in your project's root directory, do an initial run of the application and follow the output prompts using `python main.py`. If you do, skip to step 9.
9. After following the steps and verifying that `token.json` is now in the directory, press `ctrl+c` to exit the application.
10. Build the Dockerfile and run the Docker composition with `./run-bot.sh`
11. On the first run, you will get a prompt to sign into your google account. Make sure this account is added to the desired calendar. This step creates `token.json` in your directory.

### Local Development Setup (Windows)

1. [Install WSL](https://learn.microsoft.com/en-us/windows/wsl/install) and clone project into WSL.
2. Follow remaining steps from the Unix setup instructions.