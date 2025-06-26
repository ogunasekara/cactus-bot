const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('emoji_site')
		.setDescription('Quickly resize and name images to fit emoji requirements with this cool webtool.'),
	async execute(interaction) {
		await interaction.reply(`https://alchengan.github.io/snap-emoji/`);
	},
};
