const fs = require('node:fs');
const path = require('node:path');
const {
	setTestFilePath,
	initializeFile,
	addPending,
	getPending,
	updateStatus,
	removePending,
	getAllPending,
	loadPending,
	savePending,
	clearAll,
} = require('./__mocks__/pending_emoji.js');

describe('Pending Emoji System', () => {
	let testFilePath;

	const sampleEntry = {
		messageId: '111',
		channelId: '222',
		guildId: '333',
		emojiName: 'test_emoji',
		fileUrl: 'https://example.com/emoji.png',
		submittedBy: '444',
		submittedAt: '2026-01-01T00:00:00.000Z',
	};

	beforeEach(() => {
		testFilePath = path.join(TEST_DATA_DIR, `test_pending_${Date.now()}.json`);
		setTestFilePath(testFilePath);
		initializeFile();
	});

	afterEach(() => {
		if (fs.existsSync(testFilePath)) {
			fs.unlinkSync(testFilePath);
		}
	});

	describe('File initialization', () => {
		test('should create file with empty object', () => {
			const data = loadPending();
			expect(data).toEqual({});
		});

		test('should not overwrite existing file', () => {
			addPending(sampleEntry);
			initializeFile();
			const data = loadPending();
			expect(data['111']).toBeDefined();
		});
	});

	describe('addPending', () => {
		test('should add a pending entry keyed by messageId', () => {
			addPending(sampleEntry);
			const data = loadPending();
			expect(data['111']).toBeDefined();
			expect(data['111'].emojiName).toBe('test_emoji');
			expect(data['111'].status).toBe('pending');
		});

		test('should set default submittedAt if not provided', () => {
			const { submittedAt, ...entryWithoutTime } = sampleEntry;
			addPending(entryWithoutTime);
			const data = loadPending();
			expect(data['111'].submittedAt).toBeDefined();
		});

		test('should store all required fields', () => {
			addPending(sampleEntry);
			const entry = loadPending()['111'];
			expect(entry.messageId).toBe('111');
			expect(entry.channelId).toBe('222');
			expect(entry.guildId).toBe('333');
			expect(entry.emojiName).toBe('test_emoji');
			expect(entry.fileUrl).toBe('https://example.com/emoji.png');
			expect(entry.submittedBy).toBe('444');
		});
	});

	describe('getPending', () => {
		test('should return pending entry', () => {
			addPending(sampleEntry);
			const result = getPending('111');
			expect(result).not.toBeNull();
			expect(result.emojiName).toBe('test_emoji');
		});

		test('should return null for non-existent messageId', () => {
			expect(getPending('999')).toBeNull();
		});

		test('should return null for non-pending status', () => {
			addPending(sampleEntry);
			updateStatus('111', 'approved');
			expect(getPending('111')).toBeNull();
		});
	});

	describe('updateStatus', () => {
		test('should update status of existing entry', () => {
			addPending(sampleEntry);
			const result = updateStatus('111', 'approved');
			expect(result).toBe(true);
			const data = loadPending();
			expect(data['111'].status).toBe('approved');
		});

		test('should return false for non-existent entry', () => {
			const result = updateStatus('999', 'approved');
			expect(result).toBe(false);
		});
	});

	describe('removePending', () => {
		test('should remove existing entry', () => {
			addPending(sampleEntry);
			const result = removePending('111');
			expect(result).toBe(true);
			const data = loadPending();
			expect(data['111']).toBeUndefined();
		});

		test('should return false for non-existent entry', () => {
			const result = removePending('999');
			expect(result).toBe(false);
		});
	});

	describe('getAllPending', () => {
		test('should return only pending entries', () => {
			addPending(sampleEntry);
			addPending({ ...sampleEntry, messageId: '555', emojiName: 'emoji2' });
			addPending({ ...sampleEntry, messageId: '666', emojiName: 'emoji3' });
			updateStatus('555', 'approved');

			const pending = getAllPending();
			expect(pending).toHaveLength(2);
			expect(pending.map(e => e.messageId)).toContain('111');
			expect(pending.map(e => e.messageId)).toContain('666');
		});

		test('should return empty array when no pending entries', () => {
			expect(getAllPending()).toEqual([]);
		});
	});

	describe('clearAll', () => {
		test('should remove all entries', () => {
			addPending(sampleEntry);
			addPending({ ...sampleEntry, messageId: '555' });
			clearAll();
			expect(loadPending()).toEqual({});
		});
	});
});
