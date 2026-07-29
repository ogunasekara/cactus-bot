const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("Check how many available emoji slots are remaining."),
  async execute(interaction) {
    let emoji_count = 0;
    let animated_emoji_count = 0;
    const emoji_limit = 250;

    for (const emoji of interaction.guild.emojis.cache.values()) {
      if (emoji.animated) {
        animated_emoji_count += 1;
      } else {
        emoji_count += 1;
      }
    }

    const remaining_emojis = emoji_limit - emoji_count;
    const remaining_animated_emojis = emoji_limit - animated_emoji_count;

    await interaction.reply(
      `There are ${remaining_emojis} available emoji slots and ${remaining_animated_emojis} available animated emoji slots remaining!`,
    );
  },
};
