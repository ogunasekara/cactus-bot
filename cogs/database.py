import os

from discord.ext import commands
from supabase import create_client, Client

class Database(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        self.supabase: Client = create_client(url, key)

    def create_user(self, member_id, points):
        self.supabase.table('members').insert({'member_id': member_id, 'points': points}).execute()

    def add_points(self, member_id, points):
        data = self.supabase.table('members').select('*').eq('member_id', member_id).execute()

        if len(data.data) == 0:
            self.create_user(member_id=member_id, points=points)
        else:
            old_points = data.data[0]['points']

            # handle if points is None
            if old_points is None:
                new_points = points
            else:
                new_points = old_points + points

            self.supabase.table('members').update({'points': new_points}).eq('member_id', member_id).execute()
    
    def get_points(self, member_id):
        data = self.supabase.table('members').select('*').eq('member_id', member_id).execute()
        if len(data.data) == 0:
            return None
        else:
            return data.data[0]['points']
        
async def setup(bot):
    await bot.add_cog(Database(bot))
