import typing
import re

from discord.ext import commands

ADMIN_ROLE = 'Admin'

class Emoji(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    # TODO: make into a button
    @commands.command()
    async def emoji_site(self, ctx):
        """
        Quickly resize and name images to fit emoji requirements with this lil webtool.
        """
        await ctx.send("https://alchengan.github.io/snap-emoji/")

    @commands.command()
    async def slots(self, ctx):
        """
        Check how many available emoji slots are remaining.
        """
        emoji_count = 0
        animated_emoji_count = 0
        emoji_limit = ctx.guild.emoji_limit

        for emoji in ctx.guild.emojis:
            if (emoji.animated):
                animated_emoji_count += 1
            else:
                emoji_count += 1
        
        remaining_emojis = emoji_limit - emoji_count
        remaining_animated_emojis = emoji_limit - animated_emoji_count
        await ctx.send(f"There are {remaining_emojis} available emoji slots and {remaining_animated_emojis} available animated emoji slots remaining.")

    @commands.Cog.listener()
    async def on_message(self, message):
        # add initial reaction to pending mod approval message
        if message.author.bot and message.content.endswith("pending mod approval..."):
            await message.add_reaction('👍')

    @commands.Cog.listener()
    async def on_reaction_add(self, reaction, user):
        message = reaction.message

        # only process logic for thumbs up react
        if reaction.emoji != '👍':
            return

        # only process logic for admin reacts
        is_admin = False
        for role in user.roles:
            if role.name == ADMIN_ROLE:
                is_admin = True

        if is_admin and message.content.endswith("pending mod approval..."):
            parent_message = await message.channel.fetch_message(message.reference.message_id)

            # get message
            emoji_bytes = await parent_message.attachments[0].read()
            emoji_name = message.content.split(' ')[0]

            # ensure that emoji hasn't been added already
            for emoji in message.guild.emojis:
                if emoji.name == emoji_name:
                    return

            # create custom emoji
            emoji = await message.guild.create_custom_emoji(name=emoji_name, image=emoji_bytes)

            # react that emoji has been created
            await message.channel.send(f"{emoji_name} approved! {emoji}")

    @commands.command()
    async def emoji(self, ctx, name: typing.Optional[str]):
        """
        Run this command with an attached image suited to be an emoji. Emoji will be added after mod approval. Image must be a .png or .jpg less than 256kb, name must be at least 2 characters long, and contain only alphanumeric characters or underscores.
        """
        if len(ctx.message.attachments) == 0:
            await ctx.send("Please attach an image.")
            return
        else:
            pot_emoji = ctx.message.attachments[0]

            # get name of emoji
            emoji_name = None
            if name != None:
                emoji_name = name
            else:
                # remove extension from name
                emoji_name = ''.join(pot_emoji.filename.split('.')[:-1])
            
            # verify name is properly formatted
            if not re.match("^[\w\d_]{2,}$", emoji_name):
                await ctx.reply(f"Improper name {emoji_name}.")
                return
            
            # check filetype
            allowed_content_types = ["image/png", "image/jpg", "image/jpeg", "image/gif"]
            if (pot_emoji.content_type not in allowed_content_types):
                await ctx.reply("Incompatible file type.")
                return
            
            # check file size
            # TODO: this might need to be flipped
            if (pot_emoji.size / 1024 > 256):
                await ctx.reply("File is too large.")
                return
            
            # verify name is not in use
            for emoji in ctx.guild.emojis:
                if emoji.name == emoji_name:
                    await ctx.reply("Emoji name already in use.")
                    return

            await ctx.reply(f"{emoji_name} pending mod approval...")

async def setup(bot):
    await bot.add_cog(Emoji(bot))