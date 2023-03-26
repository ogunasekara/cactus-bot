import discord
import asyncio
import random

from dotenv import load_dotenv
from google_calendar import *

# TODO: put function to list all events that week (keep a cache for each week)
# TODO: functionality to keep track of users birthdays
# TODO: look for hook for new google calendar events and update cache
# TODO: update to message at specific time of day
# TODO: see if I can get an unexpiring token for google calendar access
# TODO: use from discord.ext import commands, commands.Bot

load_dotenv()

# Bot modules
google_calendar = GoogleCalendar()

# Discord Constants
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
DISCORD_CHANNEL_ID = int(os.getenv("DISCORD_CHANNEL_ID"))

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

# Define the function to post to the Discord channel
async def post_events_to_discord(date):
    channel = client.get_channel(DISCORD_CHANNEL_ID)  # Replace channel_id with the actual channel ID
    events = google_calendar.get_events(date)

    if len(events) == 0:
        await channel.send(f"No events today.")
    else:
        await channel.send(f"Today's Events:\n")
        for event in events:
            await channel.send(f"{event['summary']} at {event['start'].get('dateTime', event['start'].get('date'))}\n")

# Define the on_ready event handler for the Discord bot
@client.event
async def on_ready():
    print(f'Logged in as {client.user}')

    # Check for events every hour and post to the Discord channel if there is an event on today
    # while True:
    #     date = get_date()
    #     await post_events_to_discord(date)
    #     await asyncio.sleep(3600)  # Check every hour

@client.event
async def on_message(message):
    # only check plans channel
    if message.channel.id == DISCORD_CHANNEL_ID:
        channel = message.channel
        print("content: ", message.content)
        if message.content == '~events-day':
            date = get_date()
            await post_events_to_discord(date)
        elif message.content == '~eric':
            await channel.send('Fuck you Eric.')
        elif message.content.startswith('~roll'):
            num = message.content[5:]
            try:
                num = int(num)
                await channel.send('You rolled a ' + str(random.randint(1,num)) + '.')
            except ValueError as e:
                await channel.send('Usage error, please use a number. E.g. ~roll 12')

if __name__ == '__main__':
    # Run the Discord bot
    client.run(DISCORD_TOKEN)