const path = require('node:path');
const fs = require('node:fs');
const FileStorage = require('../utilities/file_storage');

describe('FileStorage', () => {
	let storage;
	let testFilePath;

	beforeEach(async () => {
		testFilePath = path.join(TEST_DATA_DIR, `test_storage_${Date.now()}_${Math.random().toString(36).substr(2)}.json`);
		storage = new FileStorage(testFilePath);
		await storage.initialize();
	});

	afterEach(async () => {
		await storage.close();
		if (fs.existsSync(testFilePath)) {
			fs.unlinkSync(testFilePath);
		}
	});

	const sampleEvent = (overrides = {}) => ({
		id: 'evt-' + Math.random().toString(36).substr(2),
		title: 'Sample Event',
		description: 'A sample event',
		startTime: '2026-03-01T14:00:00.000Z',
		endTime: '2026-03-01T16:00:00.000Z',
		location: 'Test Location',
		createdBy: 'user123',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...overrides,
	});

	describe('initialize', () => {
		test('should create data directory if it does not exist', async () => {
			const nestedPath = path.join(TEST_DATA_DIR, 'nested', 'dir', 'events.json');
			const nestedStorage = new FileStorage(nestedPath);
			await nestedStorage.initialize();

			const dirExists = fs.existsSync(path.dirname(nestedPath));
			expect(dirExists).toBe(true);

			// Cleanup
			fs.rmSync(path.join(TEST_DATA_DIR, 'nested'), { recursive: true });
		});
	});

	describe('loadEvents / saveEvents', () => {
		test('should return empty array when file does not exist', async () => {
			const events = await storage.loadEvents();
			expect(events).toEqual([]);
		});

		test('should save and load events', async () => {
			const events = [sampleEvent(), sampleEvent({ title: 'Second' })];
			await storage.saveEvents(events);

			const loaded = await storage.loadEvents();
			expect(loaded).toHaveLength(2);
			expect(loaded[0].title).toBe('Sample Event');
			expect(loaded[1].title).toBe('Second');
		});

		test('should return empty array for corrupted JSON', async () => {
			fs.writeFileSync(testFilePath, 'not valid json{{{');
			const events = await storage.loadEvents();
			expect(events).toEqual([]);
		});
	});

	describe('addEvent', () => {
		test('should add event and return it', async () => {
			const event = sampleEvent();
			const result = await storage.addEvent(event);

			expect(result).toEqual(event);
			const loaded = await storage.loadEvents();
			expect(loaded).toHaveLength(1);
		});

		test('should append to existing events', async () => {
			await storage.addEvent(sampleEvent({ id: 'evt-1' }));
			await storage.addEvent(sampleEvent({ id: 'evt-2' }));

			const loaded = await storage.loadEvents();
			expect(loaded).toHaveLength(2);
		});
	});

	describe('getEventById', () => {
		test('should find event by ID', async () => {
			const event = sampleEvent({ id: 'find-me' });
			await storage.addEvent(event);

			const found = await storage.getEventById('find-me');
			expect(found).toBeDefined();
			expect(found.id).toBe('find-me');
		});

		test('should return undefined for missing ID', async () => {
			const found = await storage.getEventById('missing');
			expect(found).toBeUndefined();
		});
	});

	describe('updateEvent', () => {
		test('should update event fields and set updatedAt', async () => {
			await storage.addEvent(sampleEvent({ id: 'upd-1', title: 'Original' }));

			const updated = await storage.updateEvent('upd-1', { title: 'Changed' });
			expect(updated.title).toBe('Changed');
			expect(updated.id).toBe('upd-1');
			expect(updated.updatedAt).toBeDefined();
		});

		test('should preserve fields not being updated', async () => {
			await storage.addEvent(sampleEvent({
				id: 'upd-2',
				title: 'Keep Me',
				location: 'Stay',
			}));

			const updated = await storage.updateEvent('upd-2', { title: 'New Title' });
			expect(updated.title).toBe('New Title');
			expect(updated.location).toBe('Stay');
		});

		test('should throw for non-existent event', async () => {
			await expect(storage.updateEvent('nope', { title: 'X' }))
				.rejects.toThrow('Event not found');
		});

		test('should persist update to file', async () => {
			await storage.addEvent(sampleEvent({ id: 'persist-upd', title: 'Before' }));
			await storage.updateEvent('persist-upd', { title: 'After' });

			const loaded = await storage.loadEvents();
			expect(loaded[0].title).toBe('After');
		});
	});

	describe('deleteEvent', () => {
		test('should remove event and return it', async () => {
			await storage.addEvent(sampleEvent({ id: 'del-1', title: 'Gone' }));
			await storage.addEvent(sampleEvent({ id: 'del-2', title: 'Stay' }));

			const deleted = await storage.deleteEvent('del-1');
			expect(deleted.title).toBe('Gone');

			const remaining = await storage.loadEvents();
			expect(remaining).toHaveLength(1);
			expect(remaining[0].id).toBe('del-2');
		});

		test('should throw for non-existent event', async () => {
			await expect(storage.deleteEvent('nope'))
				.rejects.toThrow('Event not found');
		});
	});

	describe('searchEvents', () => {
		beforeEach(async () => {
			await storage.addEvent(sampleEvent({
				id: 'search-1',
				title: 'Board Game Night',
				description: 'Play some games',
				startTime: '2026-06-15T19:00:00.000Z',
				createdBy: 'user1',
			}));
			await storage.addEvent(sampleEvent({
				id: 'search-2',
				title: 'Movie Night',
				description: 'Watch a board game documentary',
				startTime: '2026-06-20T20:00:00.000Z',
				createdBy: 'user2',
			}));
			await storage.addEvent(sampleEvent({
				id: 'search-3',
				title: 'Hiking Trip',
				description: 'Outdoor adventure',
				startTime: '2026-07-10T08:00:00.000Z',
				createdBy: 'user1',
			}));
		});

		test('should search by query in title', async () => {
			const results = await storage.searchEvents({ query: 'Hiking' });
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('search-3');
		});

		test('should search by query in description', async () => {
			const results = await storage.searchEvents({ query: 'adventure' });
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('search-3');
		});

		test('should filter by userId', async () => {
			const results = await storage.searchEvents({ userId: 'user1' });
			expect(results).toHaveLength(2);
		});

		test('should filter by date range', async () => {
			const results = await storage.searchEvents({
				startDate: new Date('2026-06-01'),
				endDate: new Date('2026-06-30'),
			});
			expect(results).toHaveLength(2);
			expect(results.map(e => e.id)).toEqual(
				expect.arrayContaining(['search-1', 'search-2']),
			);
		});

		test('should combine query and userId', async () => {
			const results = await storage.searchEvents({
				query: 'board game',
				userId: 'user2',
			});
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('search-2');
		});

		test('should return all events with empty criteria', async () => {
			const results = await storage.searchEvents({});
			expect(results).toHaveLength(3);
		});
	});

	describe('getEventsInRange', () => {
		test('should delegate to searchEvents with date range', async () => {
			await storage.addEvent(sampleEvent({
				id: 'range-1',
				startTime: '2026-04-15T10:00:00.000Z',
			}));
			await storage.addEvent(sampleEvent({
				id: 'range-2',
				startTime: '2026-05-15T10:00:00.000Z',
			}));

			const results = await storage.getEventsInRange(
				new Date('2026-04-01'),
				new Date('2026-04-30'),
			);
			expect(results).toHaveLength(1);
			expect(results[0].id).toBe('range-1');
		});
	});

	describe('getEventsByUser', () => {
		test('should delegate to searchEvents with userId', async () => {
			await storage.addEvent(sampleEvent({ id: 'u1', createdBy: 'alpha' }));
			await storage.addEvent(sampleEvent({ id: 'u2', createdBy: 'beta' }));
			await storage.addEvent(sampleEvent({ id: 'u3', createdBy: 'alpha' }));

			const results = await storage.getEventsByUser('alpha');
			expect(results).toHaveLength(2);
			expect(results.every(e => e.createdBy === 'alpha')).toBe(true);
		});
	});
});
