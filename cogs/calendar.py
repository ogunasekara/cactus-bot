import os
import datetime

from dotenv import load_dotenv
from discord.ext import commands

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

load_dotenv()

SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
TUCSONIANS_CALENDAR_ID = os.getenv("CALENDAR_ID")

MT_TIMEZONE = datetime.timezone(datetime.timedelta(hours=-7))
CT_TIMEZONE = datetime.timezone(datetime.timedelta(hours=-5))
PT_TIMEZONE = datetime.timezone(datetime.timedelta(hours=-7))

def get_date():
    return datetime.datetime.now(MT_TIMEZONE).date()

class Calendar(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.creds = self.get_google_calendar_creds()
        self.service = build('calendar', 'v3', credentials=self.creds)
        self.storage = self.bot.get_cog('Storage')

    @commands.Cog.listener()
    async def on_ready(self):
        # print todays events everyday at 7 AM MT
        pass

    @commands.command()
    async def events_day(self, ctx):
        date = get_date()
        events = self.get_events(date)
        
        if len(events) == 0:
            await ctx.send(f"No events today.")
        else:
            await ctx.send(f"Today's Events:\n")
            for event in events:
                await ctx.send(f"{event['summary']} at {event['start'].get('dateTime', event['start'].get('date'))}\n")
    
    def get_events(self, date):
        self.update_cache(date)
        return self.storage.get_calendar_cache()[date]

    def get_google_calendar_creds(self):
        creds = None
        
        if os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json', SCOPES)

        # If there are no (valid) credentials available, let the user log in.
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    'credentials.json', SCOPES)
                creds = flow.run_local_server(port=int(os.getenv("CALENDAR_TOKEN_PORT")))
            # Save the credentials for the next run
            with open('token.json', 'w') as token:
                token.write(creds.to_json())

        return creds
    
    def update_cache(self, date, force_update=False):
        # don't update if we've already checked this day
        calendar_cache = self.storage.get_calendar_cache()
        if not force_update and date in calendar_cache.keys():
            return
        
        print("Updating calendar cache.")

        now = date.isoformat() + 'T00:00:00.00-07:00'
        
        events_result = self.service.events().list(
            calendarId=TUCSONIANS_CALENDAR_ID,
            timeZone='MST', 
            timeMin=now, 
            maxResults=10, 
            singleEvents=True, 
            orderBy='startTime').execute()
        
        events = events_result.get('items', [])

        # Check if there is an event on today
        todays_events = []

        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            start_time = datetime.datetime.fromisoformat(start)
            if start_time.date() == date:
                todays_events.append(event)

        calendar_cache[date] = todays_events
        self.storage.set_calendar_cache(calendar_cache)

async def setup(bot):
    await bot.add_cog(Calendar(bot))