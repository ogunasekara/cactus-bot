import discord
import asyncio

from dotenv import load_dotenv
from discord.ext.commands import Bot

load_dotenv()

initial_extensions = (
    'cogs.storage',
    'cogs.calendar',
    'cogs.emoji',
    'cogs.utility',
    'cogs.economy',
)

class CactusBot(Bot):
    def __init__(self):
        # craft intents
        intents = discord.Intents.default()
        intents.message_content = True

        super().__init__(command_prefix='$', intents=intents)

        # load extensions
        asyncio.run(self.load_extensions())
    
    async def load_extensions(self):
        for extension in initial_extensions:
            try:
                await self.load_extension(extension)
                print(f'Loaded extension {extension}.')
            except Exception as e:
                print(f'Failed to load extension {extension}.')