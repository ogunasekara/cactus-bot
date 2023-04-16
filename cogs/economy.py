import discord
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
        voice_logs = self.storage.get_voice_log_cache()

        # First time a user ever joins a voice channel in the server
        if member.id not in voice_logs:
            voice_logs[member.id] = {'name': member.name,'start_time': datetime.utcnow(), 'total_time': 0, 'cactus_points': 0}
            self.storage.set_voice_log_cache(voice_logs)

        # When a user joins a voice channel 
        if not before.channel and after.channel:
            voice_logs[member.id]['start_time'] = datetime.utcnow()
            self.storage.set_voice_log_cache(voice_logs)

        # Whens a user leaves a voice channel 
        elif before.channel and not after.channel:
            if member.id in voice_logs:
                # Calcs the total amount of time a user has been in vc's
                total_time = (datetime.utcnow() - voice_logs[member.id]['start_time']).total_seconds()
                voice_logs[member.id]['total_time'] += total_time
                time = voice_logs[member.id]['total_time']

                # Calcs 5 and 15 min intervals 
                five_min_points = math.floor(time / 300) * 10
                fifteen_min_points = math.floor(time / 900) * 50

                voice_logs[member.id]['cactus_points'] = five_min_points + fifteen_min_points
                voice_logs[member.id]['start_time'] = None

                # Dumps data into the data store
                self.storage.set_voice_log_cache(voice_logs)

    # Comments/function provided by chat gpt :)
    def get_top_ten(self):
        voice_logs = self.storage.get_voice_log_cache()
        items = voice_logs.items()
        sorted_items = sorted(items, key=lambda x: x[1]['cactus_points'], reverse=True)
        return sorted_items

    # Prints out the point leaderboard 
    @commands.command()
    async def leaderboard(self, ctx):
        """
        Outputs the top 8 users with the most cactus points. Weird formatting happens after displaying 9 people, look into later
        """
        file = discord.File("cactus.png")

        embed=discord.Embed(title="**Cactus Points Leaderboard**", description="", color=0x109319)        
        embed.set_thumbnail(url="attachment://cactus.png")

        sorted_users = self.get_top_ten()
        for i in range(min(len(sorted_users), 8)):
           user_title = "**User**" if i == 0 else ""
           cactus_title = "**Cactus Points**" if i == 0 else ""
           embed.add_field(name=user_title, value=sorted_users[i][1]['name'], inline=True)
           embed.add_field(name=cactus_title, value=sorted_users[i][1]['cactus_points'], inline=True)
           embed.add_field(name="", value="", inline=True)

        await ctx.send(file=file, embed=embed)

    # Prints out individual stats
    @commands.command()
    async def stats(self, ctx):
        """
        Prints individual cactus point stats
        """
        voice_logs = self.storage.get_voice_log_cache()

        embed=discord.Embed(title="Cactus Points", description="", color=0x109319)
        embed.set_thumbnail(url=ctx.author.avatar)

        time_in_voice = int(voice_logs[ctx.message.author.id]['total_time'])
        [days, hours, minutes, _] = self.format_time(time_in_voice)

        points_str = "Cactus Points: " + str(voice_logs[ctx.message.author.id]['cactus_points'])
        time_str = "Time in Voice: " + "%d hours, %d min" % ((days * 24) + hours, minutes)

        content = points_str + "\n" + time_str

        embed.add_field(name=voice_logs[ctx.message.author.id]['name'], value=content, inline=False)
        await ctx.send(embed=embed)
    
    def format_time(self, time):
        day = time // (24 * 3600)
        time %= (24 * 3600)
        hours = time // 3600
        time %= 3600
        minutes = time // 60
        time %= 60
        seconds = time

        return [day, hours, minutes, seconds]
        
async def setup(bot):
    await bot.add_cog(Economy(bot))