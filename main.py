import asyncio
import os

from dotenv import load_dotenv
from bot import CactusBot

load_dotenv()

bot = CactusBot()

async def main():
    async with bot:
        await bot.start(token=os.getenv("DISCORD_TOKEN"))

if __name__ == '__main__':
    asyncio.run(main())