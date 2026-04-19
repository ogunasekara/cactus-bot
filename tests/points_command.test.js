const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pointsCommand = require('../commands/utility/points.js');

// Mock the cactus_points module
jest.mock('../utilities/cactus_points.js', () => ({
  getTotalPoints: jest.fn(),
  getDailyPoints: jest.fn(),
  canEarnPointsToday: jest.fn(),
  getLeaderboard: jest.fn(),
}));

// Mock EmbedBuilder to store property values
jest.mock('discord.js', () => {
  const originalModule = jest.requireActual('discord.js');
  return {
    ...originalModule,
    EmbedBuilder: jest.fn().mockImplementation(() => {
      const embed = {};
      embed.setColor = jest.fn((color) => { embed.color = color; return embed; });
      embed.setTitle = jest.fn((title) => { embed.title = title; return embed; });
      embed.setThumbnail = jest.fn((url) => { embed.thumbnail = { url }; return embed; });
      embed.addFields = jest.fn((...fields) => { embed.fields = fields.flat(); return embed; });
      embed.setFooter = jest.fn((footer) => { embed.footer = footer; return embed; });
      embed.setTimestamp = jest.fn(() => { embed.timestamp = new Date().toISOString(); return embed; });
      embed.setDescription = jest.fn((desc) => { embed.description = desc; return embed; });
      return embed;
    }),
  };
});

const {
  getTotalPoints,
  getDailyPoints,
  canEarnPointsToday,
  getLeaderboard,
} = require('../utilities/cactus_points.js');

describe('Points Command', () => {
  let mockInteraction;
  let mockUser;
  let mockTargetUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: '123456789',
      username: 'TestUser',
      displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png'),
    };

    mockTargetUser = {
      id: '987654321',
      username: 'TargetUser',
      displayAvatarURL: jest.fn().mockReturnValue('https://example.com/target-avatar.png'),
    };

    mockInteraction = {
      options: {
        getSubcommand: jest.fn(),
        getUser: jest.fn(),
      },
      user: mockUser,
      reply: jest.fn(),
      client: {
        users: {
          fetch: jest.fn(),
        },
      },
    };
  });

  // Helper to set up check subcommand mocks
  function setupCheckMocks({ targetUser = null, total = 0, daily = 0, canEarn = true } = {}) {
    mockInteraction.options.getSubcommand.mockReturnValue('check');
    mockInteraction.options.getUser.mockReturnValue(targetUser);
    getTotalPoints.mockReturnValue(total);
    getDailyPoints.mockReturnValue(daily);
    canEarnPointsToday.mockReturnValue(canEarn);
  }

  describe('Command Structure', () => {
    test('should have correct command name and description', () => {
      expect(pointsCommand.data.name).toBe('points');
      expect(pointsCommand.data.description).toBe('Check your cactus points or view the leaderboard');
    });

    test('should have check subcommand', () => {
      const checkSubcommand = pointsCommand.data.options.find(opt => opt.name === 'check');
      expect(checkSubcommand).toBeDefined();
      expect(checkSubcommand.description).toBe('Check your cactus points');
    });

    test('should have leaderboard subcommand', () => {
      const leaderboardSubcommand = pointsCommand.data.options.find(opt => opt.name === 'leaderboard');
      expect(leaderboardSubcommand).toBeDefined();
      expect(leaderboardSubcommand.description).toBe('View the cactus points leaderboard');
    });

    test('should have optional user parameter in check subcommand', () => {
      const checkSubcommand = pointsCommand.data.options.find(opt => opt.name === 'check');
      const userOption = checkSubcommand.options.find(opt => opt.name === 'user');
      expect(userOption).toBeDefined();
      expect(userOption.required).toBe(false);
    });
  });

  describe('Check Subcommand', () => {
    test('should check own points when no user specified', async () => {
      setupCheckMocks({ total: 150, daily: 75 });

      await pointsCommand.execute(mockInteraction);

      expect(getTotalPoints).toHaveBeenCalledWith(mockUser.id);
      expect(getDailyPoints).toHaveBeenCalledWith(mockUser.id);
      expect(canEarnPointsToday).toHaveBeenCalledWith(mockUser.id);
      expect(mockInteraction.reply).toHaveBeenCalled();
    });

    test('should check specified user points', async () => {
      setupCheckMocks({ targetUser: mockTargetUser, total: 200, daily: 50 });

      await pointsCommand.execute(mockInteraction);

      expect(getTotalPoints).toHaveBeenCalledWith(mockTargetUser.id);
      expect(getDailyPoints).toHaveBeenCalledWith(mockTargetUser.id);
      expect(canEarnPointsToday).toHaveBeenCalledWith(mockTargetUser.id);
    });

    test('should create embed with correct structure', async () => {
      setupCheckMocks({ total: 150, daily: 75 });

      await pointsCommand.execute(mockInteraction);

      const embed = mockInteraction.reply.mock.calls[0][0].embeds[0];
      expect(embed.title).toBe('🌵 Cactus Points');
      expect(embed.color).toBe(0x00ff00);
      expect(embed.thumbnail.url).toBe('https://example.com/avatar.png');
      expect(embed.fields).toHaveLength(5);
      expect(embed.footer.text).toBe('Earn points by being in voice channels! (1 point per minute, max 100 per day)');
      expect(embed.timestamp).toBeDefined();

      const fieldNames = embed.fields.map(field => field.name);
      expect(fieldNames).toContain('User');
      expect(fieldNames).toContain('Total Points');
      expect(fieldNames).toContain('Today\'s Points');
      expect(fieldNames).toContain('Remaining Today');
      expect(fieldNames).toContain('Can Earn More');
    });

    test('should show correct field values', async () => {
      setupCheckMocks({ total: 150, daily: 75 });

      await pointsCommand.execute(mockInteraction);

      const embed = mockInteraction.reply.mock.calls[0][0].embeds[0];
      const field = (name) => embed.fields.find(f => f.name === name);

      expect(field('User').value).toBe('TestUser');
      expect(field('Total Points').value).toBe('150');
      expect(field('Today\'s Points').value).toBe('75/100');
      expect(field('Remaining Today').value).toBe('25');
      expect(field('Can Earn More').value).toBe('✅ Yes');
    });

    test('should show cannot earn more when at daily limit', async () => {
      setupCheckMocks({ total: 500, daily: 100, canEarn: false });

      await pointsCommand.execute(mockInteraction);

      const embed = mockInteraction.reply.mock.calls[0][0].embeds[0];
      const field = (name) => embed.fields.find(f => f.name === name);

      expect(field('Can Earn More').value).toBe('❌ No');
      expect(field('Remaining Today').value).toBe('0');
    });

    test('should handle zero points correctly', async () => {
      setupCheckMocks({ total: 0, daily: 0 });

      await pointsCommand.execute(mockInteraction);

      const embed = mockInteraction.reply.mock.calls[0][0].embeds[0];
      const field = (name) => embed.fields.find(f => f.name === name);

      expect(field('Total Points').value).toBe('0');
      expect(field('Today\'s Points').value).toBe('0/100');
      expect(field('Remaining Today').value).toBe('100');
    });
  });

  describe('Leaderboard Subcommand', () => {
    beforeEach(() => {
      mockInteraction.options.getSubcommand.mockReturnValue('leaderboard');
    });

    test('should show empty leaderboard message when no users', async () => {
      getLeaderboard.mockReturnValue([]);

      await pointsCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        'No cactus points have been earned yet! Join voice channels to start earning points.',
      );
    });

    test('should show leaderboard with medal rankings', async () => {
      getLeaderboard.mockReturnValue([
        { userId: 'user1', total: 500 },
        { userId: 'user2', total: 300 },
        { userId: 'user3', total: 100 },
      ]);
      mockInteraction.client.users.fetch
        .mockResolvedValueOnce({ username: 'User1' })
        .mockResolvedValueOnce({ username: 'User2' })
        .mockResolvedValueOnce({ username: 'User3' });

      await pointsCommand.execute(mockInteraction);

      const embed = mockInteraction.reply.mock.calls[0][0].embeds[0];
      expect(embed.title).toBe('🌵 Cactus Points Leaderboard');
      expect(embed.description).toContain('🥇 **User1** - 500 points');
      expect(embed.description).toContain('🥈 **User2** - 300 points');
      expect(embed.description).toContain('🥉 **User3** - 100 points');
    });

    test('should use numbered ranking after top 3', async () => {
      getLeaderboard.mockReturnValue([
        { userId: 'user1', total: 500 },
        { userId: 'user2', total: 300 },
        { userId: 'user3', total: 100 },
        { userId: 'user4', total: 50 },
        { userId: 'user5', total: 25 },
      ]);
      mockInteraction.client.users.fetch.mockResolvedValue({ username: 'User' });

      await pointsCommand.execute(mockInteraction);

      const embed = mockInteraction.reply.mock.calls[0][0].embeds[0];
      expect(embed.description).toContain('4. **User** - 50 points');
      expect(embed.description).toContain('5. **User** - 25 points');
    });

    test('should show Unknown User for failed user fetches', async () => {
      getLeaderboard.mockReturnValue([
        { userId: 'user1', total: 500 },
        { userId: 'unknown_user', total: 300 },
      ]);
      mockInteraction.client.users.fetch
        .mockResolvedValueOnce({ username: 'User1' })
        .mockRejectedValueOnce(new Error('User not found'));

      await pointsCommand.execute(mockInteraction);

      const embed = mockInteraction.reply.mock.calls[0][0].embeds[0];
      expect(embed.description).toContain('🥇 **User1** - 500 points');
      expect(embed.description).toContain('🥈 **Unknown User (unknown_user)** - 300 points');
    });

    test('should handle users with zero points', async () => {
      getLeaderboard.mockReturnValue([
        { userId: 'user1', total: 100 },
        { userId: 'user2', total: 0 },
      ]);
      mockInteraction.client.users.fetch.mockResolvedValue({ username: 'User' });

      await pointsCommand.execute(mockInteraction);

      const embed = mockInteraction.reply.mock.calls[0][0].embeds[0];
      expect(embed.description).toContain('🥇 **User** - 100 points');
      expect(embed.description).toContain('🥈 **User** - 0 points');
    });
  });

  describe('Error Handling', () => {
    test('should not reply for invalid subcommand', async () => {
      mockInteraction.options.getSubcommand.mockReturnValue('invalid');

      await pointsCommand.execute(mockInteraction);

      expect(mockInteraction.reply).not.toHaveBeenCalled();
    });

    test('should throw when user properties are missing', async () => {
      setupCheckMocks();
      delete mockUser.username;
      delete mockUser.displayAvatarURL;

      await expect(pointsCommand.execute(mockInteraction)).rejects.toThrow();
    });
  });
});
