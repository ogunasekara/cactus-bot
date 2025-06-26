const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('slots')
		.setDescription('Check how many available emoji slots are remaining.'),
	async execute(interaction) {

    var emoji_count = 0;
    var animated_emoji_count = 0;
    var emoji_limit = 250;

    for (var emoji of interaction.guild.emojis.cache.values()) {
      if (emoji.animated) {
        animated_emoji_count += 1
      } else {
        emoji_count += 1
      }
    }
    
    remaining_emojis = emoji_limit - emoji_count
    remaining_animated_emojis = emoji_limit - animated_emoji_count

		await interaction.reply(`There are ${remaining_emojis} available emoji slots and ${remaining_animated_emojis} available animated emoji slots remaining!`);
	},
};
