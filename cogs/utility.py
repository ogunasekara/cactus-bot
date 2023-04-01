import random

from discord.ext import commands

class Utility(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @commands.command()
    async def eric(self, ctx):
        """
        Our favorite discord member.
        """
        await ctx.send("Fuck you Eric.")

    @commands.command()
    async def ping(self, ctx):
        """
        Pong.
        """
        await ctx.send("pong!")

    @commands.command()
    async def roll(self, ctx, number_of_sides: int):
        """
        Rolls an n-sided die. Usage $roll <num_sides>.
        """
        random_number=random.randint(1,number_of_sides)
        await ctx.send(str(random_number))
        

async def setup(bot):
    await bot.add_cog(Utility(bot))