const { SlashCommandBuilder } = require('discord.js');
const { authorize, listEvents } = require('../../utilities/google_cal_utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('events')
		.setDescription('Returns a list of upcoming events.'),
	async execute(interaction) {
    const client = await authorize();
    const events = await listEvents(client);

    if (events.length > 0) {
      await interaction.reply(" - " + events.join('\n - '));
    } else {
      await interaction.reply("No upcoming events.");
    }
	},
};
