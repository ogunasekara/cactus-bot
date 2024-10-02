const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Rolls a die with n sides.')
    .addStringOption(option =>
      option.setName('n')
        .setDescription('The number of sides on the die')
        .setRequired(true)),
	async execute(interaction) {
		const roll = Math.floor(Math.random() * interaction.options.getString('n')) + 1;
    await interaction.reply(`You rolled a ${roll}!`);
	},
};
