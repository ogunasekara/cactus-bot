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
		const sides = parseInt(interaction.options.getString('n'), 10);
    if (isNaN(sides) || sides <= 0) {
        await interaction.reply('Invalid input! Please provide a positive integer for the number of sides.');
        return;
    }
    const roll = Math.floor(Math.random() * sides) + 1;
    await interaction.reply(`You rolled a ${roll}!`);
	},
};
