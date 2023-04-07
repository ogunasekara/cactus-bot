import pickle
import time

from dotenv import load_dotenv
from discord.ext import commands
from data.datastore import DataStore

PICKLE_FILEPATH = './data.pickle'
        
class Storage(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.data: DataStore = self.load_data()

    def load_data(self):
        try:
            file = open(PICKLE_FILEPATH, "rb")
            data = pickle.load(file)
            file.close()
            return data
        except Exception as e:
            print(e)
            print("No existing pickle. Creating new pickle file.")
            data = DataStore()
            file = open(PICKLE_FILEPATH, "wb")
            pickle.dump(data, file)
            file.close()
            return data
    
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

    def get_voice_log_cache(self):
        return self.data.log_cache

    def set_voice_log_cache(self, logs):
        self.data.log_cache = logs
        self.update_pickle()
    
    def update_pickle(self):
        try:
            file = open(PICKLE_FILEPATH, "wb")
            pickle.dump(self.data, file)
            file.close()
            print('updated pickle file')
        except Exception as e:
            print(e)

async def setup(bot):
    await bot.add_cog(Storage(bot))