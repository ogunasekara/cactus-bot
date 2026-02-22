const { Events, PermissionFlagsBits } = require('discord.js');

// Mock pending_emoji before requiring the handler
jest.mock('../utilities/pending_emoji.js', () => ({
	getPending: jest.fn(),
	updateStatus: jest.fn(),
}));

const pendingEmoji = require('../utilities/pending_emoji.js');
const handler = require('../events/messageReactionAdd.js');

describe('messageReactionAdd event handler', () => {
	let reaction;
	let user;
	let mockMember;
	let mockGuild;

	const pendingEntry = {
		messageId: '111',
		channelId: '222',
		guildId: '333',
		emojiName: 'test_emoji',
		fileUrl: 'https://example.com/emoji.png',
		submittedBy: '444',
		submittedAt: '2026-01-01T00:00:00.000Z',
		status: 'pending',
	};

	beforeEach(() => {
		jest.clearAllMocks();

		mockMember = {
			permissions: {
				has: jest.fn().mockReturnValue(true),
			},
		};

		mockGuild = {
			members: {
				fetch: jest.fn().mockResolvedValue(mockMember),
			},
			emojis: {
				create: jest.fn().mockResolvedValue({ toString: () => ':test_emoji:' }),
			},
		};

		reaction = {
			emoji: { name: '👍' },
			partial: false,
			fetch: jest.fn().mockResolvedValue(undefined),
			message: {
				id: '111',
				partial: false,
				fetch: jest.fn().mockResolvedValue(undefined),
				guild: mockGuild,
				reply: jest.fn().mockResolvedValue(undefined),
			},
		};

		user = {
			id: '555',
			bot: false,
		};

		pendingEmoji.getPending.mockReturnValue(pendingEntry);
	});

	test('should have correct event name', () => {
		expect(handler.name).toBe(Events.MessageReactionAdd);
	});

	test('should ignore bot reactions', async () => {
		user.bot = true;
		await handler.execute(reaction, user);
		expect(pendingEmoji.getPending).not.toHaveBeenCalled();
	});

	test('should ignore non-thumbs emoji', async () => {
		reaction.emoji.name = '❤️';
		await handler.execute(reaction, user);
		expect(pendingEmoji.getPending).not.toHaveBeenCalled();
	});

	test('should ignore non-pending messages', async () => {
		pendingEmoji.getPending.mockReturnValue(null);
		await handler.execute(reaction, user);
		expect(mockGuild.members.fetch).not.toHaveBeenCalled();
	});

	test('should ignore non-admin reactions', async () => {
		mockMember.permissions.has.mockReturnValue(false);
		await handler.execute(reaction, user);
		expect(mockMember.permissions.has).toHaveBeenCalledWith(PermissionFlagsBits.Administrator);
		expect(pendingEmoji.updateStatus).not.toHaveBeenCalled();
	});

	test('should fetch partials when needed', async () => {
		reaction.partial = true;
		reaction.message.partial = true;
		await handler.execute(reaction, user);
		expect(reaction.fetch).toHaveBeenCalled();
		expect(reaction.message.fetch).toHaveBeenCalled();
	});

	test('should approve emoji on thumbs up', async () => {
		await handler.execute(reaction, user);
		expect(mockGuild.emojis.create).toHaveBeenCalledWith({
			attachment: 'https://example.com/emoji.png',
			name: 'test_emoji',
		});
		expect(pendingEmoji.updateStatus).toHaveBeenCalledWith('111', 'approved');
		expect(reaction.message.reply).toHaveBeenCalledWith('Emoji :test_emoji: created!');
	});

	test('should deny emoji on thumbs down', async () => {
		reaction.emoji.name = '👎';
		await handler.execute(reaction, user);
		expect(pendingEmoji.updateStatus).toHaveBeenCalledWith('111', 'denied');
		expect(reaction.message.reply).toHaveBeenCalledWith('Emoji test_emoji denied!');
	});

	test('should handle emoji creation error', async () => {
		mockGuild.emojis.create.mockRejectedValue(new Error('Upload failed'));
		await handler.execute(reaction, user);
		expect(reaction.message.reply).toHaveBeenCalledWith(expect.stringContaining('Error creating emoji'));
	});

	test('should handle partial fetch error gracefully', async () => {
		reaction.partial = true;
		reaction.fetch.mockRejectedValue(new Error('Fetch failed'));
		await handler.execute(reaction, user);
		expect(pendingEmoji.getPending).not.toHaveBeenCalled();
	});

	test('should handle member fetch error gracefully', async () => {
		mockGuild.members.fetch.mockRejectedValue(new Error('Member not found'));
		await handler.execute(reaction, user);
		expect(pendingEmoji.updateStatus).not.toHaveBeenCalled();
	});
});
