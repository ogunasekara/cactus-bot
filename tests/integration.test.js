const fs = require('node:fs');
const path = require('node:path');
const {
  setTestFilePath,
  initializePointsFile,
  addPoints,
  getUserPoints,
  getDailyPoints,
  getTotalPoints,
  canEarnPointsToday,
  getLeaderboard,
  clearAllPoints,
  getCurrentDate
} = require('./__mocks__/cactus_points.js');

describe('Cactus Points Integration Tests', () => {
  let testFilePath;

  beforeEach(() => {
    // Create unique test file for each test
    testFilePath = path.join(TEST_DATA_DIR, `integration_test_${Date.now()}.json`);
    setTestFilePath(testFilePath);
    initializePointsFile();
  });

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  describe('Basic Points System', () => {
    test('should award points to users in voice channels', () => {
      const userId = 'test_user_123';
      
      // Simulate user joining voice channel
      const pointsAwarded = addPoints(userId, 1);
      expect(pointsAwarded).toBe(1);
      
      // Check user points
      const userPoints = getUserPoints(userId);
      expect(userPoints.total).toBe(1);
      expect(userPoints.daily[getCurrentDate()]).toBe(1);
    });

    test('should respect daily limit', () => {
      const userId = 'test_user_456';
      
      // Award 100 points (daily limit)
      for (let i = 0; i < 100; i++) {
        const pointsAwarded = addPoints(userId, 1);
        expect(pointsAwarded).toBe(1);
      }
      
      // Try to award more points
      const extraPoints = addPoints(userId, 1);
      expect(extraPoints).toBe(0);
      
      // Check final state
      const userPoints = getUserPoints(userId);
      expect(userPoints.total).toBe(100);
      expect(userPoints.daily[getCurrentDate()]).toBe(100);
      expect(canEarnPointsToday(userId)).toBe(false);
    });

    test('should track multiple users independently', () => {
      const user1 = 'user_1';
      const user2 = 'user_2';
      
      // Award points to both users
      addPoints(user1, 50);
      addPoints(user2, 75);
      
      // Check individual totals
      expect(getTotalPoints(user1)).toBe(50);
      expect(getTotalPoints(user2)).toBe(75);
      
      // Check daily points
      expect(getDailyPoints(user1)).toBe(50);
      expect(getDailyPoints(user2)).toBe(75);
    });
  });

  describe('Leaderboard Functionality', () => {
    test('should create leaderboard with correct ranking', () => {
      const users = [
        { id: 'user_1', points: 50 },
        { id: 'user_2', points: 100 },
        { id: 'user_3', points: 25 }
      ];

      // Award points to users
      users.forEach(user => {
        addPoints(user.id, user.points);
      });

      // Get leaderboard
      const leaderboard = getLeaderboard();

      // Check ranking (should be sorted by total points descending)
      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].userId).toBe('user_2');
      expect(leaderboard[0].total).toBe(100);
      expect(leaderboard[1].userId).toBe('user_1');
      expect(leaderboard[1].total).toBe(50);
      expect(leaderboard[2].userId).toBe('user_3');
      expect(leaderboard[2].total).toBe(25);
    });

    test('should respect leaderboard limit', () => {
      // Create 10 users
      for (let i = 1; i <= 10; i++) {
        addPoints(`user_${i}`, i * 10);
      }
      
      // Get leaderboard with limit of 5
      const leaderboard = getLeaderboard(5);
      expect(leaderboard).toHaveLength(5);
      expect(leaderboard[0].total).toBe(100); // user_10
      expect(leaderboard[4].total).toBe(60);  // user_6
    });
  });

  describe('Daily Reset Simulation', () => {
    test('should handle daily point accumulation', () => {
      const userId = 'daily_test_user';
      
      // Award points over multiple "minutes"
      for (let minute = 1; minute <= 60; minute++) {
        const pointsAwarded = addPoints(userId, 1);
        expect(pointsAwarded).toBe(1);
      }
      
      // Check final state
      expect(getTotalPoints(userId)).toBe(60);
      expect(getDailyPoints(userId)).toBe(60);
      expect(canEarnPointsToday(userId)).toBe(true);
      
      // Award more points until daily limit
      for (let minute = 61; minute <= 100; minute++) {
        const pointsAwarded = addPoints(userId, 1);
        expect(pointsAwarded).toBe(1);
      }
      
      // Try to award more (should fail)
      const extraPoints = addPoints(userId, 1);
      expect(extraPoints).toBe(0);
      
      // Final check
      expect(getTotalPoints(userId)).toBe(100);
      expect(getDailyPoints(userId)).toBe(100);
      expect(canEarnPointsToday(userId)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero point additions', () => {
      const userId = 'zero_test_user';
      
      const pointsAwarded = addPoints(userId, 0);
      expect(pointsAwarded).toBe(0);
      expect(getTotalPoints(userId)).toBe(0);
    });

    test('should handle negative point additions', () => {
      const userId = 'negative_test_user';
      
      const pointsAwarded = addPoints(userId, -10);
      expect(pointsAwarded).toBe(0);
      expect(getTotalPoints(userId)).toBe(0);
    });

    test('should handle very large point additions', () => {
      const userId = 'large_test_user';
      
      const pointsAwarded = addPoints(userId, 1000000);
      expect(pointsAwarded).toBe(100); // Should be capped at daily limit
      expect(getTotalPoints(userId)).toBe(100);
      expect(getDailyPoints(userId)).toBe(100);
    });

    test('should handle special characters in user IDs', () => {
      const specialUserId = 'user@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const pointsAwarded = addPoints(specialUserId, 25);
      expect(pointsAwarded).toBe(25);
      expect(getTotalPoints(specialUserId)).toBe(25);
    });
  });

  describe('Data Persistence', () => {
    test('should persist data between operations', () => {
      const userId = 'persistence_test_user';
      
      // Add points
      addPoints(userId, 50);
      
      // Verify data is stored
      expect(getTotalPoints(userId)).toBe(50);
      
      // Clear and reinitialize (simulating restart)
      clearAllPoints();
      initializePointsFile();
      
      // Data should be cleared
      expect(getTotalPoints(userId)).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple rapid point additions', () => {
      const userId = 'performance_test_user';
      
      // Add points rapidly
      for (let i = 0; i < 100; i++) {
        const pointsAwarded = addPoints(userId, 1);
        expect(pointsAwarded).toBe(1);
      }
      
      expect(getTotalPoints(userId)).toBe(100);
      expect(getDailyPoints(userId)).toBe(100);
    });

    test('should handle multiple users efficiently', () => {
      const numUsers = 100;
      
      // Add points for many users
      for (let i = 1; i <= numUsers; i++) {
        addPoints(`user_${i}`, i);
      }
      
      // Get leaderboard with no limit
      const leaderboard = getLeaderboard(numUsers);
      expect(leaderboard).toHaveLength(numUsers);
      expect(leaderboard[0].total).toBe(numUsers); // user_100
      expect(leaderboard[numUsers - 1].total).toBe(1); // user_1
    });
  });
}); 
