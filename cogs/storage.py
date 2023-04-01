import pickle

from dotenv import load_dotenv
from discord.ext import commands

PICKLE_FILEPATH = './data.pickle'

class DataStore:
    def __init__(self):
        self.calendar_cache = {}
        self.birthday_cache = {}
        
class Storage(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.data : DataStore = self.load_data()
        self.update_pickle()

    def load_data(self):
        try:
            return pickle.load(open(PICKLE_FILEPATH, "rb"))
        except:
            print("No existing pickle. Creating new pickle file.")
            return DataStore()
    
    def get_calendar_cache(self):
        return self.data.calendar_cache
    
    def set_calendar_cache(self, calendar_cache):
        self.data.calendar_cache = calendar_cache
        self.update_pickle()
    
    def get_birthday_cache(self):
        return self.data.birthday_cache
    
    def set_birthday_cache(self, birthday_cache):
        self.data.birthday_cache = birthday_cache
        self.update_pickle()
    
    def update_pickle(self):
        pickle.dump(self.data, open(PICKLE_FILEPATH, "wb"))


async def setup(bot):
    await bot.add_cog(Storage(bot))