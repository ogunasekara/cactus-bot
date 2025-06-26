const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EventManager = require('../../utilities/event_manager');

const eventManager = new EventManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete-event')
		.setDescription('Delete an existing event')
		.addStringOption(option =>
			option.setName('event_id')
				.setDescription('The ID of the event to delete')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();

		try {
			const eventId = interaction.options.getString('event_id');

			// Check if event exists
			const existingEvent = await eventManager.getEventById(eventId);
			if (!existingEvent) {
				return await interaction.editReply('❌ Event not found. Please check the event ID.');
			}

			// Check if user is the creator of the event
			if (existingEvent.createdBy !== interaction.user.id) {
				return await interaction.editReply('❌ You can only delete events that you created.');
			}

			// Delete the event
			const deletedEvent = await eventManager.deleteEvent(eventId);

			// Create embed response
			const embed = new EmbedBuilder()
				.setColor(0xFF6B6B)
				.setTitle('🗑️ Event Deleted Successfully')
				.addFields(
					{ name: 'Title', value: deletedEvent.title, inline: true },
					{ name: 'Start Time', value: new Date(deletedEvent.startTime).toLocaleString(), inline: true },
					{ name: 'Event ID', value: deletedEvent.id, inline: true }
				)
				.setTimestamp();

			if (deletedEvent.description) {
				embed.addFields({ name: 'Description', value: deletedEvent.description, inline: false });
			}
			if (deletedEvent.endTime) {
				embed.addFields({ name: 'End Time', value: new Date(deletedEvent.endTime).toLocaleString(), inline: true });
			}
			if (deletedEvent.location) {
				embed.addFields({ name: 'Location', value: deletedEvent.location, inline: true });
			}

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error('Error deleting event:', error);
			await interaction.editReply('❌ An error occurred while deleting the event. Please try again.');
		}
	},
}; 
