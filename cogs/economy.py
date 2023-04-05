import discord
import time
import math
from discord.ext import commands
from datetime import datetime

class Economy(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.storage = self.bot.get_cog('Storage')
        self.voice_logs = self.storage.get_voice_log_cache()
        
    # Listener that updates when a user joins and leaves a voice channel
    @commands.Cog.listener()
    async def on_voice_state_update(self, member, before, after):
        # First time a user ever joins a voice channel in the server
        if member.id not in self.voice_logs:
            self.voice_logs[member.id] = {'member_obj': member,'start_time': datetime.utcnow(), 'total_time': 0, 'cactus_points': 0}

        # When a user joins a voice channel 
        if not before.channel and after.channel:
            # Sets the start time when a user joins a vc
            self.voice_logs[member.id]['start_time'] = datetime.utcnow()
        # Whens a user leaves a voice channel 
        elif before.channel and not after.channel:
            if member.id in self.voice_logs:
                # Calcs the total amount of time a user has been in vc's
                total_time = (datetime.utcnow() - self.voice_logs[member.id]['start_time']).total_seconds()
                self.voice_logs[member.id]['total_time'] += total_time
                # Grabs total time
                time = self.voice_logs[member.id]['total_time']
                # Calcs 5 and 15 min intervals 
                five_min = math.floor(time / 300)
                fifteen_min = math.floor(time / 900)
                # Sets the number of cactus points a user has
                self.voice_logs[member.id]['cactus_points'] = (five_min * 10) + (fifteen_min * 50)
                # Clears start time (gets reset next time a user joins a vc)
                self.voice_logs[member.id]['start_time'] = None
                # Dumps data into the data store
                self.storage.set_voice_log_cache(self.voice_logs)

    # Comments/function provided by chat gpt :)
    def get_top_ten(self):
        # Create a list of tuples from the dictionary, where each tuple is (key, value)
        items = self.voice_logs.items()
        # Sort the list of tuples based on the 'cactus_points' value in descending order
        sorted_items = sorted(items, key=lambda x: x[1]['cactus_points'], reverse=True)
        # Return the sorted list of tuples
        return sorted_items

    # Prints out the point leaderboard 
    @commands.command()
    async def leaderboard(self, ctx):
        """
        Outputs the top 10 users with the most cactus points
        """
        embed=discord.Embed(title="Cactus Points Leaderboard", description="", color=0x109319)
        file = discord.File("cactus.png")
        embed.set_thumbnail(url="attachment://cactus.png")
        embed.add_field(name="User", value="", inline=True)
        embed.add_field(name="", value="**Cactus Points**", inline=True)
        sorted_users = self.get_top_ten()
        for i in range(min(len(sorted_users), 10)):
           embed.add_field(name=sorted_users[i][1]['member_obj'].name, value= "", inline=True)
           embed.add_field(name=sorted_users[i][1]['cactus_points'], value="", inline=True)
        await ctx.send(file=file, embed=embed)

    # Prints out individual stats
    @commands.command()
    async def stats(self, ctx):
        """
        Prints individual cactus point stats
        """
        embed=discord.Embed(title="Cactus Points", description="", color=0x109319)
        # Sets the thumbnail to be the profile pic of whoever used the stat command
        embed.set_thumbnail(url=ctx.author.avatar)
        points = "Cactus Points: " + str(self.voice_logs[ctx.message.author.id]['cactus_points'])
        time_in_voice = "Time in Voice: " + str(self.voice_logs[ctx.message.author.id]['total_time'])
        content = points + "\n" + time_in_voice
        embed.add_field(name=self.voice_logs[ctx.message.author.id]['member_obj'].name, value=content, inline=False)
        await ctx.send(embed=embed)
        
async def setup(bot):
    await bot.add_cog(Economy(bot))