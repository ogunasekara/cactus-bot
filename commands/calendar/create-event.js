const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const EventManager = require('../../utilities/event_manager');

const eventManager = new EventManager();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create-event')
		.setDescription('Create a new event')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('The title of the event')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('start_time')
				.setDescription('Start time (YYYY-MM-DD HH:MM)')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('description')
				.setDescription('Description of the event')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('end_time')
				.setDescription('End time (YYYY-MM-DD HH:MM)')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('location')
				.setDescription('Location of the event')
				.setRequired(false)),
	async execute(interaction) {
		await interaction.deferReply();

		try {
			const title = interaction.options.getString('title');
			const description = interaction.options.getString('description') || '';
			const startTimeStr = interaction.options.getString('start_time');
			const endTimeStr = interaction.options.getString('end_time');
			const location = interaction.options.getString('location') || '';

			// Parse and validate start time
			const startTime = new Date(startTimeStr);
			if (isNaN(startTime.getTime())) {
				return await interaction.editReply('❌ Invalid start time format. Please use YYYY-MM-DD HH:MM');
			}

			// Parse and validate end time
			let endTime = null;
			if (endTimeStr) {
				endTime = new Date(endTimeStr);
				if (isNaN(endTime.getTime())) {
					return await interaction.editReply('❌ Invalid end time format. Please use YYYY-MM-DD HH:MM');
				}
				if (endTime <= startTime) {
					return await interaction.editReply('❌ End time must be after start time');
				}
			}

			// Create the event
			const eventData = {
				title,
				description,
				startTime: startTime.toISOString(),
				endTime: endTime ? endTime.toISOString() : null,
				location,
				createdBy: interaction.user.id
			};

			const newEvent = await eventManager.createEvent(eventData);

			// Create embed response
			const embed = new EmbedBuilder()
				.setColor(0x00FF00)
				.setTitle('✅ Event Created Successfully')
				.addFields(
					{ name: 'Title', value: newEvent.title, inline: true },
					{ name: 'Start Time', value: new Date(newEvent.startTime).toLocaleString(), inline: true },
					{ name: 'Event ID', value: newEvent.id, inline: true }
				)
				.setTimestamp();

			if (newEvent.description) {
				embed.addFields({ name: 'Description', value: newEvent.description, inline: false });
			}
			if (newEvent.endTime) {
				embed.addFields({ name: 'End Time', value: new Date(newEvent.endTime).toLocaleString(), inline: true });
			}
			if (newEvent.location) {
				embed.addFields({ name: 'Location', value: newEvent.location, inline: true });
			}

			await interaction.editReply({ embeds: [embed] });

		} catch (error) {
			console.error('Error creating event:', error);
			await interaction.editReply('❌ An error occurred while creating the event. Please try again.');
		}
	},
}; 
