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
  getCurrentDate,
  clearAllPoints,
  resetUserPoints,
  loadPoints,
  savePoints
} = require('./__mocks__/cactus_points.js');

describe('Cactus Points System', () => {
  let testFilePath;
  const testUserId = '123456789';
  const testUserId2 = '987654321';

  beforeEach(() => {
    // Create unique test file for each test
    testFilePath = path.join(TEST_DATA_DIR, `test_points_${Date.now()}.json`);
    setTestFilePath(testFilePath);
    initializePointsFile();
  });

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  describe('File Operations', () => {
    test('should initialize empty points file', () => {
      const data = loadPoints();
      expect(data).toEqual({});
    });

    test('should save and load points data correctly', () => {
      const testData = {
        [testUserId]: {
          total: 50,
          daily: { '2024-01-01': 25, '2024-01-02': 25 }
        }
      };
      
      savePoints(testData);
      const loadedData = loadPoints();
      expect(loadedData).toEqual(testData);
    });

    test('should handle file read errors gracefully', () => {
      // Set invalid file path
      setTestFilePath('/invalid/path/points.json');
      const data = loadPoints();
      expect(data).toEqual({});
    });
  });

  describe('Date Functions', () => {
    test('should return current date in YYYY-MM-DD format', () => {
      const date = getCurrentDate();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      const now = new Date();
      const expectedDate = now.toISOString().split('T')[0];
      expect(date).toBe(expectedDate);
    });
  });

  describe('User Points Management', () => {
    test('should return default points for new user', () => {
      const points = getUserPoints(testUserId);
      expect(points).toEqual({ total: 0, daily: {} });
    });

    test('should add points to new user', () => {
      const pointsAdded = addPoints(testUserId, 10);
      expect(pointsAdded).toBe(10);
      
      const userPoints = getUserPoints(testUserId);
      expect(userPoints.total).toBe(10);
      expect(userPoints.daily[getCurrentDate()]).toBe(10);
    });

    test('should add points to existing user', () => {
      addPoints(testUserId, 10);
      const pointsAdded = addPoints(testUserId, 15);
      expect(pointsAdded).toBe(15);
      
      const userPoints = getUserPoints(testUserId);
      expect(userPoints.total).toBe(25);
      expect(userPoints.daily[getCurrentDate()]).toBe(25);
    });

    test('should respect daily limit of 100 points', () => {
      // Add 100 points
      const pointsAdded1 = addPoints(testUserId, 100);
      expect(pointsAdded1).toBe(100);
      
      // Try to add more points
      const pointsAdded2 = addPoints(testUserId, 50);
      expect(pointsAdded2).toBe(0);
      
      const userPoints = getUserPoints(testUserId);
      expect(userPoints.total).toBe(100);
      expect(userPoints.daily[getCurrentDate()]).toBe(100);
    });

    test('should handle partial daily limit', () => {
      // Add 80 points first
      addPoints(testUserId, 80);
      
      // Try to add 50 more (should only add 20)
      const pointsAdded = addPoints(testUserId, 50);
      expect(pointsAdded).toBe(20);
      
      const userPoints = getUserPoints(testUserId);
      expect(userPoints.total).toBe(100);
      expect(userPoints.daily[getCurrentDate()]).toBe(100);
    });

    test('should not add negative points', () => {
      const pointsAdded = addPoints(testUserId, -10);
      expect(pointsAdded).toBe(0);
      
      const userPoints = getUserPoints(testUserId);
      expect(userPoints.total).toBe(0);
    });
  });

  describe('Daily Points Tracking', () => {
    test('should return 0 daily points for new user', () => {
      const dailyPoints = getDailyPoints(testUserId);
      expect(dailyPoints).toBe(0);
    });

    test('should track daily points correctly', () => {
      addPoints(testUserId, 25);
      const dailyPoints = getDailyPoints(testUserId);
      expect(dailyPoints).toBe(25);
    });

    test('should return 0 for user with no daily points', () => {
      // Add points to create user record but no daily points
      const pointsData = loadPoints();
      pointsData[testUserId] = { total: 0, daily: {} };
      savePoints(pointsData);
      
      const dailyPoints = getDailyPoints(testUserId);
      expect(dailyPoints).toBe(0);
    });
  });

  describe('Total Points Tracking', () => {
    test('should return 0 total points for new user', () => {
      const totalPoints = getTotalPoints(testUserId);
      expect(totalPoints).toBe(0);
    });

    test('should track total points correctly', () => {
      addPoints(testUserId, 30);
      addPoints(testUserId, 20);
      
      const totalPoints = getTotalPoints(testUserId);
      expect(totalPoints).toBe(50);
    });

    test('should handle user with no total points', () => {
      const pointsData = loadPoints();
      pointsData[testUserId] = { total: 0, daily: {} };
      savePoints(pointsData);
      
      const totalPoints = getTotalPoints(testUserId);
      expect(totalPoints).toBe(0);
    });
  });

  describe('Daily Limit Checking', () => {
    test('should allow earning points when under daily limit', () => {
      addPoints(testUserId, 50);
      const canEarn = canEarnPointsToday(testUserId);
      expect(canEarn).toBe(true);
    });

    test('should prevent earning points when at daily limit', () => {
      addPoints(testUserId, 100);
      const canEarn = canEarnPointsToday(testUserId);
      expect(canEarn).toBe(false);
    });

    test('should prevent earning points when over daily limit', () => {
      // Manually set over limit for testing edge cases
      const pointsData = loadPoints();
      pointsData[testUserId] = {
        total: 150,
        daily: { [getCurrentDate()]: 150 }
      };
      savePoints(pointsData);
      
      const canEarn = canEarnPointsToday(testUserId);
      expect(canEarn).toBe(false);
    });

    test('should allow earning points for new user', () => {
      const canEarn = canEarnPointsToday(testUserId);
      expect(canEarn).toBe(true);
    });
  });

  describe('Leaderboard Functionality', () => {
    test('should return empty leaderboard for no users', () => {
      const leaderboard = getLeaderboard();
      expect(leaderboard).toEqual([]);
    });

    test('should return leaderboard sorted by total points', () => {
      addPoints(testUserId, 50);
      addPoints(testUserId2, 100);
      
      const leaderboard = getLeaderboard();
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].userId).toBe(testUserId2);
      expect(leaderboard[0].total).toBe(100);
      expect(leaderboard[1].userId).toBe(testUserId);
      expect(leaderboard[1].total).toBe(50);
    });

    test('should respect leaderboard limit', () => {
      // Add multiple users
      const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
      users.forEach((userId, index) => {
        const pointsData = loadPoints();
        pointsData[userId] = { total: index + 1, daily: {} };
        savePoints(pointsData);
      });
      
      const leaderboard = getLeaderboard(3);
      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].total).toBe(5);
      expect(leaderboard[1].total).toBe(4);
      expect(leaderboard[2].total).toBe(3);
    });

    test('should handle users with zero points in leaderboard', () => {
      const pointsData = loadPoints();
      pointsData[testUserId] = { total: 0, daily: {} };
      pointsData[testUserId2] = { total: 25, daily: {} };
      savePoints(pointsData);
      
      const leaderboard = getLeaderboard();
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].userId).toBe(testUserId2);
      expect(leaderboard[0].total).toBe(25);
      expect(leaderboard[1].userId).toBe(testUserId);
      expect(leaderboard[1].total).toBe(0);
    });
  });

  describe('Test Utilities', () => {
    test('should clear all points data', () => {
      addPoints(testUserId, 50);
      addPoints(testUserId2, 25);
      
      clearAllPoints();
      
      const data = loadPoints();
      expect(data).toEqual({});
    });

    test('should reset specific user points', () => {
      addPoints(testUserId, 50);
      addPoints(testUserId2, 25);
      
      resetUserPoints(testUserId);
      
      const user1Points = getTotalPoints(testUserId);
      const user2Points = getTotalPoints(testUserId2);
      
      expect(user1Points).toBe(0);
      expect(user2Points).toBe(25);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle very large point additions', () => {
      const pointsAdded = addPoints(testUserId, 1000000);
      expect(pointsAdded).toBe(100); // Should be capped at daily limit
      
      const userPoints = getUserPoints(testUserId);
      expect(userPoints.total).toBe(100);
      expect(userPoints.daily[getCurrentDate()]).toBe(100);
    });

    test('should handle zero point additions', () => {
      const pointsAdded = addPoints(testUserId, 0);
      expect(pointsAdded).toBe(0);
      
      const userPoints = getUserPoints(testUserId);
      expect(userPoints.total).toBe(0);
    });

    test('should handle multiple rapid point additions', () => {
      for (let i = 0; i < 10; i++) {
        addPoints(testUserId, 10);
      }
      
      const userPoints = getUserPoints(testUserId);
      expect(userPoints.total).toBe(100);
      expect(userPoints.daily[getCurrentDate()]).toBe(100);
    });

    test('should handle special characters in user IDs', () => {
      const specialUserId = 'user@#$%^&*()_+-=[]{}|;:,.<>?';
      const pointsAdded = addPoints(specialUserId, 25);
      expect(pointsAdded).toBe(25);
      
      const userPoints = getUserPoints(specialUserId);
      expect(userPoints.total).toBe(25);
    });
  });
}); 
