const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { authorize, listEvents } = require('../../utilities/google_cal_utils');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('events')
		.setDescription('Returns a list of upcoming events.'),
	async execute(interaction) {
    const client = await authorize();
    const events = await listEvents(client);

    if (events.length > 0) {
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📅 Upcoming Events')
        .setDescription('Here are your upcoming events:')
        .addFields(
          events.map((eventString, index) => {
            // Parse the event string to separate event name and date
            const parts = eventString.split(' @ ');
            const eventName = parts[0];
            const dateTime = parts[1];
            
            // Format the date for display
            const date = new Date(dateTime);
            const formattedDate = date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric'
            }) + ' @ ' + date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            });
            
            return {
              name: formattedDate,
              value: eventName,
              inline: false
            };
          })
        )
        .setTimestamp()
        .setFooter({ text: 'Calendar Events' });

      await interaction.reply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor(0xFF6B6B)
        .setTitle('📅 No Events Found')
        .setDescription('No upcoming events found in your calendar.')
        .setTimestamp()
        .setFooter({ text: 'Calendar Events' });

      await interaction.reply({ embeds: [embed] });
    }
	},
};
