from dotenv import load_dotenv
import random
from discord.ext import commands

class Utility(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @commands.command()
    async def eric(self, ctx):
        await ctx.send("Fuck you Eric.")

    @commands.command()
    async def dice_roll(self, ctx, number_of_sides: int):
        random_number=random.randint(1,number_of_sides)
        await ctx.send(str(random_number))
        

async def setup(bot):
    await bot.add_cog(Utility(bot))