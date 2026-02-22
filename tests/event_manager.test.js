const path = require('node:path');
const fs = require('node:fs');
const EventManager = require('../utilities/event_manager');
const FileStorage = require('../utilities/file_storage');

describe('EventManager', () => {
	let eventManager;
	let testFilePath;

	beforeEach(async () => {
		testFilePath = path.join(TEST_DATA_DIR, `test_events_${Date.now()}_${Math.random().toString(36).substr(2)}.json`);
		const storage = new FileStorage(testFilePath);
		eventManager = new EventManager(storage);
		await eventManager.initialize();
	});

	afterEach(async () => {
		await eventManager.close();
		if (fs.existsSync(testFilePath)) {
			fs.unlinkSync(testFilePath);
		}
	});

	describe('initialization', () => {
		test('should initialize only once', async () => {
			expect(eventManager.initialized).toBe(true);
			await eventManager.initialize();
			expect(eventManager.initialized).toBe(true);
		});

		test('should auto-initialize on first operation', async () => {
			const storage = new FileStorage(testFilePath);
			const manager = new EventManager(storage);
			expect(manager.initialized).toBe(false);
			await manager.getAllEvents();
			expect(manager.initialized).toBe(true);
		});

		test('should default to FileStorage when no backend provided', () => {
			const manager = new EventManager();
			expect(manager.storage).toBeInstanceOf(FileStorage);
		});
	});

	describe('generateId', () => {
		test('should generate unique IDs', () => {
			const ids = new Set();
			for (let i = 0; i < 100; i++) {
				ids.add(eventManager.generateId());
			}
			expect(ids.size).toBe(100);
		});

		test('should generate string IDs', () => {
			const id = eventManager.generateId();
			expect(typeof id).toBe('string');
			expect(id.length).toBeGreaterThan(0);
		});
	});

	describe('createEvent', () => {
		test('should create an event with all fields', async () => {
			const eventData = {
				title: 'Test Event',
				description: 'A test event',
				startTime: '2026-03-01T14:00:00.000Z',
				endTime: '2026-03-01T16:00:00.000Z',
				location: 'Conference Room',
				createdBy: 'user123',
			};

			const event = await eventManager.createEvent(eventData);

			expect(event.id).toBeDefined();
			expect(event.title).toBe('Test Event');
			expect(event.description).toBe('A test event');
			expect(event.startTime).toBe('2026-03-01T14:00:00.000Z');
			expect(event.endTime).toBe('2026-03-01T16:00:00.000Z');
			expect(event.location).toBe('Conference Room');
			expect(event.createdBy).toBe('user123');
			expect(event.createdAt).toBeDefined();
			expect(event.updatedAt).toBeDefined();
		});

		test('should default optional fields to empty strings', async () => {
			const event = await eventManager.createEvent({
				title: 'Minimal Event',
				startTime: '2026-03-01T14:00:00.000Z',
				createdBy: 'user123',
			});

			expect(event.description).toBe('');
			expect(event.location).toBe('');
		});

		test('should persist event to storage', async () => {
			await eventManager.createEvent({
				title: 'Persisted Event',
				startTime: '2026-03-01T14:00:00.000Z',
				createdBy: 'user123',
			});

			const allEvents = await eventManager.getAllEvents();
			expect(allEvents).toHaveLength(1);
			expect(allEvents[0].title).toBe('Persisted Event');
		});
	});

	describe('getEventById', () => {
		test('should return event by ID', async () => {
			const created = await eventManager.createEvent({
				title: 'Find Me',
				startTime: '2026-03-01T14:00:00.000Z',
				createdBy: 'user123',
			});

			const found = await eventManager.getEventById(created.id);
			expect(found).toBeDefined();
			expect(found.title).toBe('Find Me');
		});

		test('should return undefined for non-existent ID', async () => {
			const found = await eventManager.getEventById('nonexistent');
			expect(found).toBeUndefined();
		});
	});

	describe('updateEvent', () => {
		test('should update event fields', async () => {
			const created = await eventManager.createEvent({
				title: 'Original Title',
				startTime: '2026-03-01T14:00:00.000Z',
				createdBy: 'user123',
			});

			const updated = await eventManager.updateEvent(created.id, {
				title: 'Updated Title',
			});

			expect(updated.title).toBe('Updated Title');
			expect(updated.startTime).toBe('2026-03-01T14:00:00.000Z');
		});

		test('should update the updatedAt timestamp', async () => {
			const created = await eventManager.createEvent({
				title: 'Test',
				startTime: '2026-03-01T14:00:00.000Z',
				createdBy: 'user123',
			});

			// Small delay to ensure timestamp differs
			await new Promise(resolve => setTimeout(resolve, 10));

			const updated = await eventManager.updateEvent(created.id, {
				title: 'Changed',
			});

			expect(new Date(updated.updatedAt).getTime())
				.toBeGreaterThanOrEqual(new Date(created.updatedAt).getTime());
		});

		test('should throw for non-existent event', async () => {
			await expect(eventManager.updateEvent('nonexistent', { title: 'X' }))
				.rejects.toThrow('Event not found');
		});
	});

	describe('deleteEvent', () => {
		test('should delete event and return it', async () => {
			const created = await eventManager.createEvent({
				title: 'Delete Me',
				startTime: '2026-03-01T14:00:00.000Z',
				createdBy: 'user123',
			});

			const deleted = await eventManager.deleteEvent(created.id);
			expect(deleted.title).toBe('Delete Me');

			const allEvents = await eventManager.getAllEvents();
			expect(allEvents).toHaveLength(0);
		});

		test('should throw for non-existent event', async () => {
			await expect(eventManager.deleteEvent('nonexistent'))
				.rejects.toThrow('Event not found');
		});
	});

	describe('searchEvents', () => {
		beforeEach(async () => {
			await eventManager.createEvent({
				title: 'Board Game Night',
				description: 'Play some games',
				startTime: '2026-03-01T19:00:00.000Z',
				createdBy: 'user1',
			});
			await eventManager.createEvent({
				title: 'Movie Night',
				description: 'Watch a board game documentary',
				startTime: '2026-03-05T20:00:00.000Z',
				createdBy: 'user2',
			});
			await eventManager.createEvent({
				title: 'Hiking Trip',
				description: 'Outdoor adventure',
				startTime: '2026-03-10T08:00:00.000Z',
				createdBy: 'user1',
			});
		});

		test('should search by title', async () => {
			const results = await eventManager.searchEvents('Hiking');
			expect(results).toHaveLength(1);
			expect(results[0].title).toBe('Hiking Trip');
		});

		test('should search by description', async () => {
			const results = await eventManager.searchEvents('board game');
			expect(results).toHaveLength(2);
		});

		test('should be case-insensitive', async () => {
			const results = await eventManager.searchEvents('HIKING');
			expect(results).toHaveLength(1);
			expect(results[0].title).toBe('Hiking Trip');
		});

		test('should return empty array for no matches', async () => {
			const results = await eventManager.searchEvents('nonexistent');
			expect(results).toHaveLength(0);
		});
	});

	describe('getEventsByUser', () => {
		beforeEach(async () => {
			await eventManager.createEvent({
				title: 'User1 Event A',
				startTime: '2026-03-01T14:00:00.000Z',
				createdBy: 'user1',
			});
			await eventManager.createEvent({
				title: 'User2 Event',
				startTime: '2026-03-02T14:00:00.000Z',
				createdBy: 'user2',
			});
			await eventManager.createEvent({
				title: 'User1 Event B',
				startTime: '2026-03-03T14:00:00.000Z',
				createdBy: 'user1',
			});
		});

		test('should return events by user', async () => {
			const results = await eventManager.getEventsByUser('user1');
			expect(results).toHaveLength(2);
			expect(results.every(e => e.createdBy === 'user1')).toBe(true);
		});

		test('should return empty array for user with no events', async () => {
			const results = await eventManager.getEventsByUser('nobody');
			expect(results).toHaveLength(0);
		});
	});

	describe('getUpcomingEvents', () => {
		test('should return events within the specified days ahead', async () => {
			const now = new Date();
			const tomorrow = new Date(now);
			tomorrow.setDate(now.getDate() + 1);
			const nextMonth = new Date(now);
			nextMonth.setDate(now.getDate() + 45);

			await eventManager.createEvent({
				title: 'Tomorrow Event',
				startTime: tomorrow.toISOString(),
				createdBy: 'user1',
			});
			await eventManager.createEvent({
				title: 'Far Future Event',
				startTime: nextMonth.toISOString(),
				createdBy: 'user1',
			});

			const upcoming = await eventManager.getUpcomingEvents(14);
			expect(upcoming).toHaveLength(1);
			expect(upcoming[0].title).toBe('Tomorrow Event');
		});

		test('should default to 14 days', async () => {
			const now = new Date();
			const inRange = new Date(now);
			inRange.setDate(now.getDate() + 7);

			await eventManager.createEvent({
				title: 'Within Default Range',
				startTime: inRange.toISOString(),
				createdBy: 'user1',
			});

			const upcoming = await eventManager.getUpcomingEvents();
			expect(upcoming).toHaveLength(1);
		});

		test('should not return past events', async () => {
			const past = new Date();
			past.setDate(past.getDate() - 1);

			await eventManager.createEvent({
				title: 'Past Event',
				startTime: past.toISOString(),
				createdBy: 'user1',
			});

			const upcoming = await eventManager.getUpcomingEvents(14);
			expect(upcoming).toHaveLength(0);
		});
	});

	describe('getEventsInRange', () => {
		test('should return events within date range', async () => {
			await eventManager.createEvent({
				title: 'In Range',
				startTime: '2026-06-15T14:00:00.000Z',
				createdBy: 'user1',
			});
			await eventManager.createEvent({
				title: 'Out of Range',
				startTime: '2026-08-01T14:00:00.000Z',
				createdBy: 'user1',
			});

			const results = await eventManager.getEventsInRange(
				new Date('2026-06-01'),
				new Date('2026-07-01'),
			);
			expect(results).toHaveLength(1);
			expect(results[0].title).toBe('In Range');
		});
	});

	describe('searchEventsAdvanced', () => {
		test('should combine multiple criteria', async () => {
			await eventManager.createEvent({
				title: 'Game Night',
				startTime: '2026-06-15T19:00:00.000Z',
				createdBy: 'user1',
			});
			await eventManager.createEvent({
				title: 'Game Day',
				startTime: '2026-06-20T12:00:00.000Z',
				createdBy: 'user2',
			});

			const results = await eventManager.searchEventsAdvanced({
				query: 'Game',
				userId: 'user1',
			});
			expect(results).toHaveLength(1);
			expect(results[0].title).toBe('Game Night');
		});
	});
});
