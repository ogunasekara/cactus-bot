const fs = require('node:fs');
const path = require('node:path');

// Allow test file path to be overridden
let POINTS_FILE = path.join(__dirname, '../../data/cactus_points.json');

// Function to set test file path
function setTestFilePath(testPath) {
  POINTS_FILE = testPath;
}

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(POINTS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Initialize points file if it doesn't exist
function initializePointsFile() {
  ensureDataDir();
  if (!fs.existsSync(POINTS_FILE)) {
    fs.writeFileSync(POINTS_FILE, JSON.stringify({}));
  }
}

// Load points data from file
function loadPoints() {
  try {
    const data = fs.readFileSync(POINTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading points data:', error);
    return {};
  }
}

// Save points data to file
function savePoints(pointsData) {
  try {
    fs.writeFileSync(POINTS_FILE, JSON.stringify(pointsData, null, 2));
  } catch (error) {
    console.error('Error saving points data:', error);
  }
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

// Get user's points
function getUserPoints(userId) {
  const pointsData = loadPoints();
  return pointsData[userId] || { total: 0, daily: {} };
}

// Add points to user
function addPoints(userId, pointsToAdd) {
  const pointsData = loadPoints();
  const currentDate = getCurrentDate();
  
  if (!pointsData[userId]) {
    pointsData[userId] = { total: 0, daily: {} };
  }
  
  if (!pointsData[userId].daily[currentDate]) {
    pointsData[userId].daily[currentDate] = 0;
  }
  
  // Check daily limit (100 points max per day)
  const currentDaily = pointsData[userId].daily[currentDate];
  const remainingDaily = Math.max(0, 100 - currentDaily);
  const actualPointsToAdd = Math.min(pointsToAdd, remainingDaily);
  
  if (actualPointsToAdd > 0) {
    pointsData[userId].total += actualPointsToAdd;
    pointsData[userId].daily[currentDate] += actualPointsToAdd;
    savePoints(pointsData);
    return actualPointsToAdd;
  }
  
  return 0;
}

// Get user's daily points for current date
function getDailyPoints(userId) {
  const pointsData = loadPoints();
  const currentDate = getCurrentDate();
  
  if (!pointsData[userId] || !pointsData[userId].daily[currentDate]) {
    return 0;
  }
  
  return pointsData[userId].daily[currentDate];
}

// Get user's total points
function getTotalPoints(userId) {
  const pointsData = loadPoints();
  return pointsData[userId]?.total || 0;
}

// Check if user can earn more points today
function canEarnPointsToday(userId) {
  const dailyPoints = getDailyPoints(userId);
  return dailyPoints < 100;
}

// Get leaderboard (top users by total points)
function getLeaderboard(limit = 10) {
  const pointsData = loadPoints();
  const users = Object.entries(pointsData)
    .map(([userId, data]) => ({
      userId,
      total: data.total || 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
  
  return users;
}

// Clear all points data (for testing)
function clearAllPoints() {
  savePoints({});
}

// Reset user's points (for testing)
function resetUserPoints(userId) {
  const pointsData = loadPoints();
  delete pointsData[userId];
  savePoints(pointsData);
}

module.exports = {
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
}; 
