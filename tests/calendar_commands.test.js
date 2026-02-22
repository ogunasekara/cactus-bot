// Shared mock methods - these persist across module re-requires
const mockCreateEvent = jest.fn();
const mockGetEventById = jest.fn();
const mockUpdateEvent = jest.fn();
const mockDeleteEvent = jest.fn();
const mockGetUpcomingEvents = jest.fn();
const mockGetAllEvents = jest.fn();

// Mock EventManager before any command module is loaded
jest.mock('../utilities/event_manager', () => {
	return jest.fn().mockImplementation(() => ({
		createEvent: mockCreateEvent,
		getEventById: mockGetEventById,
		updateEvent: mockUpdateEvent,
		deleteEvent: mockDeleteEvent,
		getUpcomingEvents: mockGetUpcomingEvents,
		getAllEvents: mockGetAllEvents,
	}));
});

// Mock discord.js
jest.mock('discord.js', () => ({
	SlashCommandBuilder: class {
		setName() { return this; }
		setDescription() { return this; }
		addStringOption(fn) { fn(this); return this; }
		addIntegerOption(fn) { fn(this); return this; }
		setRequired() { return this; }
		setMinValue() { return this; }
		setMaxValue() { return this; }
	},
	EmbedBuilder: class {
		constructor() { this.data = {}; }
		setColor() { return this; }
		setTitle(t) { this.data.title = t; return this; }
		setDescription(d) { this.data.description = d; return this; }
		setTimestamp() { return this; }
		setFooter() { return this; }
		addFields(...fields) {
			this.data.fields = this.data.fields || [];
			this.data.fields.push(...fields.flat());
			return this;
		}
	},
}));

// Helper to create a mock interaction
function createMockInteraction(options = {}) {
	const optionValues = { ...options };
	return {
		deferReply: jest.fn().mockResolvedValue(undefined),
		editReply: jest.fn().mockResolvedValue(undefined),
		user: { id: options._userId || 'user123' },
		options: {
			getString: jest.fn((name) => optionValues[name] ?? null),
			getInteger: jest.fn((name) => optionValues[name] ?? null),
		},
	};
}

// Load commands once (mocks are already in place)
const createEventCmd = require('../commands/calendar/create-event');
const deleteEventCmd = require('../commands/calendar/delete-event');
const updateEventCmd = require('../commands/calendar/update-event');
const eventsCmd = require('../commands/calendar/events');

describe('Calendar Commands', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('/create-event', () => {
		test('should create event with valid data', async () => {
			mockCreateEvent.mockResolvedValue({
				id: 'evt-123',
				title: 'Test Event',
				description: 'A test',
				startTime: '2026-03-01T14:00:00.000Z',
				endTime: null,
				location: '',
			});

			const interaction = createMockInteraction({
				title: 'Test Event',
				start_time: '2026-03-01 14:00',
				description: 'A test',
			});

			await createEventCmd.execute(interaction);

			expect(interaction.deferReply).toHaveBeenCalled();
			expect(mockCreateEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					title: 'Test Event',
					description: 'A test',
					createdBy: 'user123',
				}),
			);
			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.objectContaining({ embeds: expect.any(Array) }),
			);
		});

		test('should reject invalid start time', async () => {
			const interaction = createMockInteraction({
				title: 'Bad Event',
				start_time: 'not-a-date',
			});

			await createEventCmd.execute(interaction);

			expect(mockCreateEvent).not.toHaveBeenCalled();
			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.stringContaining('Invalid start time'),
			);
		});

		test('should reject invalid end time', async () => {
			const interaction = createMockInteraction({
				title: 'Bad End',
				start_time: '2026-03-01 14:00',
				end_time: 'not-a-date',
			});

			await createEventCmd.execute(interaction);

			expect(mockCreateEvent).not.toHaveBeenCalled();
			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.stringContaining('Invalid end time'),
			);
		});

		test('should reject end time before start time', async () => {
			const interaction = createMockInteraction({
				title: 'Backwards',
				start_time: '2026-03-01 14:00',
				end_time: '2026-03-01 12:00',
			});

			await createEventCmd.execute(interaction);

			expect(mockCreateEvent).not.toHaveBeenCalled();
			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.stringContaining('End time must be after start time'),
			);
		});

		test('should handle errors gracefully', async () => {
			mockCreateEvent.mockRejectedValue(new Error('Storage error'));

			const interaction = createMockInteraction({
				title: 'Fail Event',
				start_time: '2026-03-01 14:00',
			});

			await createEventCmd.execute(interaction);

			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.stringContaining('error occurred'),
			);
		});
	});

	describe('/delete-event', () => {
		test('should delete event when user is creator', async () => {
			mockGetEventById.mockResolvedValue({
				id: 'evt-123',
				title: 'Delete Me',
				startTime: '2026-03-01T14:00:00.000Z',
				createdBy: 'user123',
			});
			mockDeleteEvent.mockResolvedValue({
				id: 'evt-123',
				title: 'Delete Me',
				startTime: '2026-03-01T14:00:00.000Z',
			});

			const interaction = createMockInteraction({
				event_id: 'evt-123',
				_userId: 'user123',
			});

			await deleteEventCmd.execute(interaction);

			expect(mockDeleteEvent).toHaveBeenCalledWith('evt-123');
			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.objectContaining({ embeds: expect.any(Array) }),
			);
		});

		test('should reject when event not found', async () => {
			mockGetEventById.mockResolvedValue(undefined);

			const interaction = createMockInteraction({ event_id: 'nope' });

			await deleteEventCmd.execute(interaction);

			expect(mockDeleteEvent).not.toHaveBeenCalled();
			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.stringContaining('Event not found'),
			);
		});

		test('should reject when user is not creator', async () => {
			mockGetEventById.mockResolvedValue({
				id: 'evt-123',
				createdBy: 'other-user',
			});

			const interaction = createMockInteraction({
				event_id: 'evt-123',
				_userId: 'user123',
			});

			await deleteEventCmd.execute(interaction);

			expect(mockDeleteEvent).not.toHaveBeenCalled();
			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.stringContaining('only delete events that you created'),
			);
		});
	});

	describe('/update-event', () => {
		test('should update event when user is creator', async () => {
			mockGetEventById.mockResolvedValue({
				id: 'evt-123',
				title: 'Original',
				startTime: '2026-03-01T14:00:00.000Z',
				createdBy: 'user123',
			});
			mockUpdateEvent.mockResolvedValue({
				id: 'evt-123',
				title: 'Updated',
				startTime: '2026-03-01T14:00:00.000Z',
			});

			const interaction = createMockInteraction({
				event_id: 'evt-123',
				title: 'Updated',
				_userId: 'user123',
			});

			await updateEventCmd.execute(interaction);

			expect(mockUpdateEvent).toHaveBeenCalledWith(
				'evt-123',
				expect.objectContaining({ title: 'Updated' }),
			);
		});

		test('should reject when event not found', async () => {
			mockGetEventById.mockResolvedValue(undefined);

			const interaction = createMockInteraction({
				event_id: 'nope',
				title: 'X',
			});

			await updateEventCmd.execute(interaction);

			expect(mockUpdateEvent).not.toHaveBeenCalled();
			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.stringContaining('Event not found'),
			);
		});

		test('should reject when user is not creator', async () => {
			mockGetEventById.mockResolvedValue({
				id: 'evt-123',
				createdBy: 'other-user',
			});

			const interaction = createMockInteraction({
				event_id: 'evt-123',
				title: 'Hack',
				_userId: 'user123',
			});

			await updateEventCmd.execute(interaction);

			expect(mockUpdateEvent).not.toHaveBeenCalled();
			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.stringContaining('only update events that you created'),
			);
		});

		test('should reject when no fields provided', async () => {
			mockGetEventById.mockResolvedValue({
				id: 'evt-123',
				createdBy: 'user123',
			});

			const interaction = createMockInteraction({
				event_id: 'evt-123',
				_userId: 'user123',
			});

			await updateEventCmd.execute(interaction);

			expect(mockUpdateEvent).not.toHaveBeenCalled();
			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.stringContaining('at least one field'),
			);
		});

		test('should reject invalid start time format', async () => {
			mockGetEventById.mockResolvedValue({
				id: 'evt-123',
				createdBy: 'user123',
			});

			const interaction = createMockInteraction({
				event_id: 'evt-123',
				start_time: 'bad-date',
				_userId: 'user123',
			});

			await updateEventCmd.execute(interaction);

			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.stringContaining('Invalid start time'),
			);
		});

		test('should reject end time before start time', async () => {
			mockGetEventById.mockResolvedValue({
				id: 'evt-123',
				startTime: '2026-06-15T23:00:00.000Z',
				createdBy: 'user123',
			});

			const interaction = createMockInteraction({
				event_id: 'evt-123',
				end_time: '2026-06-15 01:00',
				_userId: 'user123',
			});

			await updateEventCmd.execute(interaction);

			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.stringContaining('End time must be after start time'),
			);
		});
	});

	describe('/events', () => {
		test('should list upcoming events', async () => {
			mockGetUpcomingEvents.mockResolvedValue([
				{
					id: 'evt-1',
					title: 'Event One',
					startTime: '2026-03-01T14:00:00.000Z',
					description: '',
					location: '',
				},
				{
					id: 'evt-2',
					title: 'Event Two',
					startTime: '2026-03-05T18:00:00.000Z',
					description: 'Fun stuff',
					location: 'Park',
				},
			]);

			const interaction = createMockInteraction({});

			await eventsCmd.execute(interaction);

			expect(mockGetUpcomingEvents).toHaveBeenCalledWith(14);
			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.objectContaining({ embeds: expect.any(Array) }),
			);
		});

		test('should use custom days parameter', async () => {
			mockGetUpcomingEvents.mockResolvedValue([]);
			mockGetAllEvents.mockResolvedValue([]);

			const interaction = createMockInteraction({ days: 30 });

			await eventsCmd.execute(interaction);

			expect(mockGetUpcomingEvents).toHaveBeenCalledWith(30);
		});

		test('should show empty state when no events exist', async () => {
			mockGetUpcomingEvents.mockResolvedValue([]);
			mockGetAllEvents.mockResolvedValue([]);

			const interaction = createMockInteraction({});

			await eventsCmd.execute(interaction);

			const reply = interaction.editReply.mock.calls[0][0];
			expect(reply.embeds[0].data.title).toContain('No Events Found');
		});

		test('should show past events when no upcoming events', async () => {
			mockGetUpcomingEvents.mockResolvedValue([]);
			mockGetAllEvents.mockResolvedValue([
				{
					id: 'past-1',
					title: 'Past Event',
					startTime: '2025-01-01T14:00:00.000Z',
					description: '',
					location: '',
				},
			]);

			const interaction = createMockInteraction({});

			await eventsCmd.execute(interaction);

			const reply = interaction.editReply.mock.calls[0][0];
			expect(reply.embeds[0].data.title).toContain('No Upcoming Events');
			expect(reply.embeds[0].data.fields).toBeDefined();
			expect(reply.embeds[0].data.fields[0].name).toBe('Past Event');
		});

		test('should handle errors gracefully', async () => {
			mockGetUpcomingEvents.mockRejectedValue(new Error('fail'));

			const interaction = createMockInteraction({});

			await eventsCmd.execute(interaction);

			expect(interaction.editReply).toHaveBeenCalledWith(
				expect.stringContaining('error occurred'),
			);
		});
	});
});
