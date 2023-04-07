class DataStore:
    def __init__(self):
        self.calendar_cache = {}
        self.birthday_cache = {}
        self.log_cache = {}
    def __str__(self) -> str:
        s = "calendar: " + str(self.calendar_cache) + '\n'
        s += "birthday: " + str(self.birthday_cache) + '\n'
        s += "voice log: " + str(self.log_cache)
        return s