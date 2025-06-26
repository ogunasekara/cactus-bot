const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('eric')
		.setDescription('Eric!'),
	async execute(interaction) {
		await interaction.reply('We love you, Eric!');
	},
};
