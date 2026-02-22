const { Events } = require('discord.js');
const voiceStateUpdate = require('../events/voiceStateUpdate.js');

describe('Voice State Update Event', () => {
  let mockOldState;
  let mockNewState;
  let mockMember;
  let mockUser;
  let mockChannel;

  beforeEach(() => {
    jest.clearAllMocks();
    voiceStateUpdate.activeVoiceSessions.clear();

    mockUser = {
      id: '123456789',
      username: 'TestUser',
    };

    mockMember = { user: mockUser };

    mockChannel = {
      id: 'channel123',
      name: 'Test Voice Channel',
    };

    mockOldState = {
      channelId: null,
      member: mockMember,
    };

    mockNewState = {
      channelId: 'channel123',
      channel: mockChannel,
      member: mockMember,
    };
  });

  describe('Event Configuration', () => {
    test('should have correct event name', () => {
      expect(voiceStateUpdate.name).toBe(Events.VoiceStateUpdate);
    });

    test('should export activeVoiceSessions map', () => {
      expect(voiceStateUpdate.activeVoiceSessions).toBeInstanceOf(Map);
    });

    test('should export setTimer function', () => {
      expect(typeof voiceStateUpdate.setTimer).toBe('function');
    });

    test('should set timer reference correctly', () => {
      const mockTimer = { setActiveVoiceSessions: jest.fn() };

      voiceStateUpdate.setTimer(mockTimer);

      expect(mockTimer.setActiveVoiceSessions).toHaveBeenCalledWith(
        voiceStateUpdate.activeVoiceSessions,
      );
    });
  });

  describe('User Joins Voice Channel', () => {
    test('should track user with correct session data', async () => {
      await voiceStateUpdate.execute(mockOldState, mockNewState);

      expect(voiceStateUpdate.activeVoiceSessions.has(mockUser.id)).toBe(true);

      const session = voiceStateUpdate.activeVoiceSessions.get(mockUser.id);
      expect(session.channelId).toBe('channel123');
      expect(session.channelName).toBe('Test Voice Channel');
      expect(typeof session.joinTime).toBe('number');
      expect(typeof session.lastPointTime).toBe('number');
    });

    test('should track user even if daily limit is reached', async () => {
      await voiceStateUpdate.execute(mockOldState, mockNewState);

      expect(voiceStateUpdate.activeVoiceSessions.has(mockUser.id)).toBe(true);
    });

    test('should use Unknown Channel when channel object is null', async () => {
      mockNewState.channel = null;

      await voiceStateUpdate.execute(mockOldState, mockNewState);

      expect(voiceStateUpdate.activeVoiceSessions.has(mockUser.id)).toBe(true);
      const session = voiceStateUpdate.activeVoiceSessions.get(mockUser.id);
      expect(session.channelName).toBe('Unknown Channel');
    });

    test('should create fresh session when user rejoins after leaving', async () => {
      await voiceStateUpdate.execute(mockOldState, mockNewState);
      const firstJoinTime = voiceStateUpdate.activeVoiceSessions.get(mockUser.id).joinTime;

      await new Promise(resolve => setTimeout(resolve, 10));

      // User leaves
      await voiceStateUpdate.execute(
        { channelId: 'channel123', channel: mockChannel, member: mockMember },
        { channelId: null, member: mockMember },
      );
      expect(voiceStateUpdate.activeVoiceSessions.has(mockUser.id)).toBe(false);

      // User rejoins
      await voiceStateUpdate.execute(mockOldState, mockNewState);
      const session = voiceStateUpdate.activeVoiceSessions.get(mockUser.id);
      expect(session).toBeDefined();
      expect(session.joinTime).toBeGreaterThanOrEqual(firstJoinTime);
    });
  });

  describe('User Leaves Voice Channel', () => {
    beforeEach(() => {
      voiceStateUpdate.activeVoiceSessions.set(mockUser.id, {
        channelId: 'channel123',
        channelName: 'Test Voice Channel',
        joinTime: Date.now() - 60000,
        lastPointTime: Date.now() - 60000,
      });
    });

    test('should remove user from tracking', async () => {
      mockOldState.channelId = 'channel123';
      mockOldState.channel = mockChannel;
      mockNewState.channelId = null;

      await voiceStateUpdate.execute(mockOldState, mockNewState);

      expect(voiceStateUpdate.activeVoiceSessions.has(mockUser.id)).toBe(false);
    });

    test('should handle leaving when not tracked', async () => {
      voiceStateUpdate.activeVoiceSessions.delete(mockUser.id);

      mockOldState.channelId = 'channel123';
      mockOldState.channel = mockChannel;
      mockNewState.channelId = null;

      await voiceStateUpdate.execute(mockOldState, mockNewState);

      expect(voiceStateUpdate.activeVoiceSessions.has(mockUser.id)).toBe(false);
    });

    test('should handle null old channel object', async () => {
      mockOldState.channelId = 'channel123';
      mockOldState.channel = null;
      mockNewState.channelId = null;

      await voiceStateUpdate.execute(mockOldState, mockNewState);

      expect(voiceStateUpdate.activeVoiceSessions.has(mockUser.id)).toBe(false);
    });
  });

  describe('User Moves Between Voice Channels', () => {
    beforeEach(() => {
      voiceStateUpdate.activeVoiceSessions.set(mockUser.id, {
        channelId: 'channel123',
        channelName: 'Test Voice Channel',
        joinTime: Date.now(),
        lastPointTime: Date.now(),
      });
    });

    test('should update session with new channel info', async () => {
      mockOldState.channelId = 'channel123';
      mockOldState.channel = mockChannel;
      mockNewState.channelId = 'channel456';
      mockNewState.channel = { id: 'channel456', name: 'New Voice Channel' };

      await voiceStateUpdate.execute(mockOldState, mockNewState);

      const session = voiceStateUpdate.activeVoiceSessions.get(mockUser.id);
      expect(session.channelId).toBe('channel456');
      expect(session.channelName).toBe('New Voice Channel');
    });

    test('should preserve joinTime when moving channels', async () => {
      const originalJoinTime = voiceStateUpdate.activeVoiceSessions.get(mockUser.id).joinTime;

      mockOldState.channelId = 'channel123';
      mockOldState.channel = mockChannel;
      mockNewState.channelId = 'channel456';
      mockNewState.channel = { id: 'channel456', name: 'New Voice Channel' };

      await voiceStateUpdate.execute(mockOldState, mockNewState);

      const session = voiceStateUpdate.activeVoiceSessions.get(mockUser.id);
      expect(session.joinTime).toBe(originalJoinTime);
    });

    test('should not update session when channelId is the same', async () => {
      mockOldState.channelId = 'channel123';
      mockOldState.channel = mockChannel;
      mockNewState.channelId = 'channel123';
      mockNewState.channel = mockChannel;

      await voiceStateUpdate.execute(mockOldState, mockNewState);

      const session = voiceStateUpdate.activeVoiceSessions.get(mockUser.id);
      expect(session.channelId).toBe('channel123');
      expect(session.channelName).toBe('Test Voice Channel');
    });

    test('should not create session when untracked user moves channels', async () => {
      voiceStateUpdate.activeVoiceSessions.clear();

      mockOldState.channelId = 'channel123';
      mockOldState.channel = mockChannel;
      mockNewState.channelId = 'channel456';
      mockNewState.channel = { id: 'channel456', name: 'Other Channel' };

      await voiceStateUpdate.execute(mockOldState, mockNewState);

      expect(voiceStateUpdate.activeVoiceSessions.has(mockUser.id)).toBe(false);
    });
  });

  describe('Multiple Users', () => {
    const user2 = { id: '987654321', username: 'User2' };
    const member2 = { user: user2 };

    test('should track multiple users independently', async () => {
      await voiceStateUpdate.execute(mockOldState, mockNewState);

      await voiceStateUpdate.execute(
        { channelId: null, member: member2 },
        { channelId: 'channel456', channel: { id: 'channel456', name: 'Channel 2' }, member: member2 },
      );

      expect(voiceStateUpdate.activeVoiceSessions.has(mockUser.id)).toBe(true);
      expect(voiceStateUpdate.activeVoiceSessions.has(user2.id)).toBe(true);
      expect(voiceStateUpdate.activeVoiceSessions.size).toBe(2);
    });

    test('should handle one user leaving while others remain', async () => {
      await voiceStateUpdate.execute(mockOldState, mockNewState);

      await voiceStateUpdate.execute(
        { channelId: null, member: member2 },
        { channelId: 'channel456', channel: { id: 'channel456', name: 'Channel 2' }, member: member2 },
      );

      // First user leaves
      await voiceStateUpdate.execute(
        { channelId: 'channel123', channel: mockChannel, member: mockMember },
        { channelId: null, member: mockMember },
      );

      expect(voiceStateUpdate.activeVoiceSessions.has(mockUser.id)).toBe(false);
      expect(voiceStateUpdate.activeVoiceSessions.has(user2.id)).toBe(true);
      expect(voiceStateUpdate.activeVoiceSessions.size).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null channel in old state during leave', async () => {
      mockOldState.channel = null;
      mockNewState.channelId = null;

      await voiceStateUpdate.execute(mockOldState, mockNewState);

      expect(voiceStateUpdate.activeVoiceSessions.has(mockUser.id)).toBe(false);
    });

    test('should handle missing member property', async () => {
      delete mockNewState.member;

      await voiceStateUpdate.execute(mockOldState, mockNewState);

      expect(voiceStateUpdate.activeVoiceSessions.size).toBe(0);
    });

    test('should handle missing user property', async () => {
      delete mockNewState.member.user;

      await voiceStateUpdate.execute(mockOldState, mockNewState);

      expect(voiceStateUpdate.activeVoiceSessions.size).toBe(0);
    });
  });
});
