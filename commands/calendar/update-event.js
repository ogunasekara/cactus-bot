const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EventManager = require('../../utilities/event_manager');

const eventManager = new EventManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('update-event')
		.setDescription('Update an existing event')
		.addStringOption(option =>
			option.setName('event_id')
				.setDescription('The ID of the event to update')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('title')
				.setDescription('New title for the event')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('description')
				.setDescription('New description for the event')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('start_time')
				.setDescription('New start time (YYYY-MM-DD HH:MM)')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('end_time')
				.setDescription('New end time (YYYY-MM-DD HH:MM)')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('location')
				.setDescription('New location for the event')
				.setRequired(false)),
	async execute(interaction) {
		await interaction.deferReply();

		try {
			const eventId = interaction.options.getString('event_id');
			const title = interaction.options.getString('title');
			const description = interaction.options.getString('description');
			const startTimeStr = interaction.options.getString('start_time');
			const endTimeStr = interaction.options.getString('end_time');
			const location = interaction.options.getString('location');

			// Check if event exists
			const existingEvent = await eventManager.getEventById(eventId);
			if (!existingEvent) {
				return await interaction.editReply('❌ Event not found. Please check the event ID.');
			}

			// Check if user is the creator of the event
			if (existingEvent.createdBy !== interaction.user.id) {
				return await interaction.editReply('❌ You can only update events that you created.');
			}

			// Build update data object
			const updateData = {};
			if (title) updateData.title = title;
			if (description !== null) updateData.description = description;
			if (location !== null) updateData.location = location;

			// Handle time updates
			if (startTimeStr) {
				const startTime = new Date(startTimeStr);
				if (isNaN(startTime.getTime())) {
					return await interaction.editReply('❌ Invalid start time format. Please use YYYY-MM-DD HH:MM');
				}
				updateData.startTime = startTime.toISOString();
			}

			if (endTimeStr) {
				const endTime = new Date(endTimeStr);
				if (isNaN(endTime.getTime())) {
					return await interaction.editReply('❌ Invalid end time format. Please use YYYY-MM-DD HH:MM');
				}
				
				const startTime = updateData.startTime ? new Date(updateData.startTime) : new Date(existingEvent.startTime);
				if (endTime <= startTime) {
					return await interaction.editReply('❌ End time must be after start time');
				}
				updateData.endTime = endTime.toISOString();
			}

			// Check if any updates were provided
			if (Object.keys(updateData).length === 0) {
				return await interaction.editReply('❌ Please provide at least one field to update.');
			}

			// Update the event
			const updatedEvent = await eventManager.updateEvent(eventId, updateData);

			// Create embed response
			const embed = new EmbedBuilder()
				.setColor(0x00FF00)
				.setTitle('✅ Event Updated Successfully')
				.addFields(
					{ name: 'Title', value: updatedEvent.title, inline: true },
					{ name: 'Start Time', value: new Date(updatedEvent.startTime).toLocaleString(), inline: true },
					{ name: 'Event ID', value: updatedEvent.id, inline: true }
				)
				.setTimestamp();

			if (updatedEvent.description) {
				embed.addFields({ name: 'Description', value: updatedEvent.description, inline: false });
			}
			if (updatedEvent.endTime) {
				embed.addFields({ name: 'End Time', value: new Date(updatedEvent.endTime).toLocaleString(), inline: true });
			}
			if (updatedEvent.location) {
				embed.addFields({ name: 'Location', value: updatedEvent.location, inline: true });
			}

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error('Error updating event:', error);
			await interaction.editReply('❌ An error occurred while updating the event. Please try again.');
		}
	},
}; 
