const path = require('node:path');
const PointsTimer = require('../utilities/points_timer.js');
const {
  setTestFilePath,
  initializePointsFile,
  addPoints,
  getTotalPoints,
  clearAllPoints
} = require('./__mocks__/cactus_points.js');

// Mock the cactus_points module
jest.mock('../utilities/cactus_points.js', () => require('./__mocks__/cactus_points.js'));

describe('Points Timer', () => {
  let timer;
  let testFilePath;
  const testUserId = '123456789';
  const testUserId2 = '987654321';

  beforeEach(() => {
    testFilePath = path.join(TEST_DATA_DIR, `test_timer_${Date.now()}.json`);
    setTestFilePath(testFilePath);
    initializePointsFile();

    timer = new PointsTimer();
  });

  afterEach(() => {
    if (timer) {
      timer.stop();
    }

    const fs = require('node:fs');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    clearAllPoints();
  });

  // Helper to create a sessions map with one or more users
  function createSessions(...entries) {
    const sessionsMap = new Map();
    for (const [userId, channelId, channelName] of entries) {
      sessionsMap.set(userId, {
        channelId,
        channelName,
        joinTime: Date.now(),
        lastPointTime: Date.now(),
      });
    }
    return sessionsMap;
  }

  describe('Initialization', () => {
    test('should create timer with default state', () => {
      expect(timer.activeVoiceSessions).toBeInstanceOf(Map);
      expect(timer.timer).toBeNull();
      expect(timer.isRunning).toBe(false);
    });

    test('should set active voice sessions', () => {
      const sessionsMap = createSessions([testUserId, '123', 'Test Channel']);

      timer.setActiveVoiceSessions(sessionsMap);
      expect(timer.activeVoiceSessions).toBe(sessionsMap);
    });

    test('should return active sessions via getActiveSessions', () => {
      const sessionsMap = createSessions([testUserId, '123', 'Test Channel']);

      timer.setActiveVoiceSessions(sessionsMap);

      const activeSessions = timer.getActiveSessions();
      expect(activeSessions).toBe(sessionsMap);
      expect(activeSessions.size).toBe(1);
    });
  });

  describe('Timer Control', () => {
    test('should start timer successfully', () => {
      timer.start();
      expect(timer.isRunning).toBe(true);
      expect(timer.timer).not.toBeNull();
    });

    test('should not start timer if already running', () => {
      timer.start();
      const originalTimer = timer.timer;

      timer.start();
      expect(timer.timer).toBe(originalTimer);
    });

    test('should stop timer successfully', () => {
      timer.start();
      timer.stop();

      expect(timer.isRunning).toBe(false);
      expect(timer.timer).toBeNull();
    });

    test('should handle stopping non-running timer', () => {
      timer.stop();
      expect(timer.isRunning).toBe(false);
      expect(timer.timer).toBeNull();
    });

    test('should award points immediately on start', () => {
      const sessionsMap = createSessions([testUserId, '123', 'Test Channel']);
      timer.setActiveVoiceSessions(sessionsMap);

      timer.start();

      expect(getTotalPoints(testUserId)).toBe(1);
    });

    test('should continue awarding points on timer intervals', (done) => {
      const sessionsMap = createSessions([testUserId, '123', 'Test Channel']);
      timer.setActiveVoiceSessions(sessionsMap);

      timer.start();

      setTimeout(() => {
        expect(getTotalPoints(testUserId)).toBeGreaterThanOrEqual(1);
        timer.stop();
        done();
      }, 100);
    }, 1000);
  });

  describe('Points Awarding', () => {
    test('should award 1 point per tick to each user in voice', () => {
      const sessionsMap = createSessions(
        [testUserId, '123', 'Test Channel'],
        [testUserId2, '456', 'Another Channel'],
      );
      timer.setActiveVoiceSessions(sessionsMap);

      timer.awardPoints();

      expect(getTotalPoints(testUserId)).toBe(1);
      expect(getTotalPoints(testUserId2)).toBe(1);
    });

    test('should update lastPointTime when awarding points', () => {
      const sessionsMap = new Map();
      const originalTime = Date.now() - 60000;
      sessionsMap.set(testUserId, {
        channelId: '123',
        channelName: 'Test Channel',
        joinTime: originalTime,
        lastPointTime: originalTime,
      });
      timer.setActiveVoiceSessions(sessionsMap);

      timer.awardPoints();

      const session = timer.activeVoiceSessions.get(testUserId);
      expect(session.lastPointTime).toBeGreaterThan(originalTime);
    });

    test('should handle empty voice sessions', () => {
      timer.setActiveVoiceSessions(new Map());

      expect(() => timer.awardPoints()).not.toThrow();
      expect(timer.activeVoiceSessions.size).toBe(0);
    });

    test('should track multiple users correctly', () => {
      const sessionsMap = createSessions(
        [testUserId, '123', 'Channel 1'],
        [testUserId2, '456', 'Channel 2'],
      );
      timer.setActiveVoiceSessions(sessionsMap);
      expect(timer.activeVoiceSessions.size).toBe(2);
    });
  });

  describe('Daily Cap Behavior', () => {
    test('should not award points to users at daily limit', () => {
      addPoints(testUserId, 100);

      const sessionsMap = createSessions([testUserId, '123', 'Test Channel']);
      timer.setActiveVoiceSessions(sessionsMap);

      timer.awardPoints();

      expect(getTotalPoints(testUserId)).toBe(100);
    });

    test('should keep capped users in sessions map after reaching limit', () => {
      addPoints(testUserId, 99);

      const sessionsMap = createSessions([testUserId, '123', 'Test Channel']);
      timer.setActiveVoiceSessions(sessionsMap);

      timer.awardPoints();

      expect(timer.activeVoiceSessions.size).toBe(1);
      expect(getTotalPoints(testUserId)).toBe(100);
    });

    test('should skip capped users across multiple ticks without removing them', () => {
      addPoints(testUserId, 100);

      const sessionsMap = createSessions([testUserId, '123', 'Test Channel']);
      timer.setActiveVoiceSessions(sessionsMap);

      timer.awardPoints();
      timer.awardPoints();
      timer.awardPoints();

      expect(timer.activeVoiceSessions.size).toBe(1);
      expect(getTotalPoints(testUserId)).toBe(100);
    });

    test('should only award points to non-capped user when mixed with capped user', () => {
      addPoints(testUserId, 100);

      const sessionsMap = createSessions(
        [testUserId, '123', 'Test Channel'],
        [testUserId2, '456', 'Another Channel'],
      );
      timer.setActiveVoiceSessions(sessionsMap);

      timer.awardPoints();

      expect(timer.activeVoiceSessions.size).toBe(2);
      expect(getTotalPoints(testUserId)).toBe(100);
      expect(getTotalPoints(testUserId2)).toBe(1);
    });

    test('should not update lastPointTime for capped users', () => {
      addPoints(testUserId, 100);

      const originalTime = Date.now() - 60000;
      const sessionsMap = new Map();
      sessionsMap.set(testUserId, {
        channelId: '123',
        channelName: 'Test Channel',
        joinTime: originalTime,
        lastPointTime: originalTime,
      });
      timer.setActiveVoiceSessions(sessionsMap);

      timer.awardPoints();

      const session = timer.activeVoiceSessions.get(testUserId);
      expect(session.lastPointTime).toBe(originalTime);
    });
  });

  describe('Error Handling', () => {
    test('should remove invalid (null) session data from tracking', () => {
      const sessionsMap = new Map();
      sessionsMap.set(testUserId, null);

      timer.setActiveVoiceSessions(sessionsMap);
      timer.awardPoints();

      expect(timer.activeVoiceSessions.has(testUserId)).toBe(false);
      expect(timer.activeVoiceSessions.size).toBe(0);
    });

    test('should handle missing session properties', () => {
      const sessionsMap = new Map();
      sessionsMap.set(testUserId, { channelId: '123' });

      timer.setActiveVoiceSessions(sessionsMap);

      expect(() => timer.awardPoints()).not.toThrow();
    });
  });
});
