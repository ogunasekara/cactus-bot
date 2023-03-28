from dotenv import load_dotenv
from discord.ext import commands

class Utility(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @commands.command()
    async def eric(self, ctx):
        await ctx.send("Fuck you Eric.")

async def setup(bot):
    await bot.add_cog(Utility(bot))