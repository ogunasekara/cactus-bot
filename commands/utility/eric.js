const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('eric')
		.setDescription('Our favorite discord member!'),
	async execute(interaction) {
		await interaction.reply('Fuck you Eric.');
	},
};
