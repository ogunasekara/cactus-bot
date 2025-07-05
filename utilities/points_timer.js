const { addPoints, canEarnPointsToday } = require('./cactus_points.js');

class PointsTimer {
    constructor() {
        this.activeVoiceSessions = new Map();
        this.timer = null;
        this.isRunning = false;
    }

    // Set the active voice sessions map from the voice state update event
    setActiveVoiceSessions(sessionsMap) {
        this.activeVoiceSessions = sessionsMap;
    }

    // Start the points timer
    start() {
        if (this.isRunning) {
            console.log('Points timer is already running');
            return;
        }

        console.log('Starting cactus points timer...');
        this.isRunning = true;
        
        // Run every minute (60000 ms)
        this.timer = setInterval(() => {
            this.awardPoints();
        }, 60000);
        
        // Also run immediately to award points for users already in voice
        this.awardPoints();
    }

    // Stop the points timer
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            this.isRunning = false;
            console.log('Stopped cactus points timer');
        }
    }

    // Award points to all users currently in voice channels
    awardPoints() {
        const now = Date.now();
        const usersToRemove = [];

        for (const [userId, session] of this.activeVoiceSessions) {
            // Check if user can still earn points today
            if (!canEarnPointsToday(userId)) {
                console.log(`User ${userId} has reached daily limit, removing from tracking`);
                usersToRemove.push(userId);
                continue;
            }

            // Award 1 point for this minute
            const pointsAwarded = addPoints(userId, 1);
            
            if (pointsAwarded > 0) {
                console.log(`Awarded ${pointsAwarded} cactus point(s) to user ${userId} in ${session.channelName}`);
                
                // Update last point time
                session.lastPointTime = now;
            } else {
                console.log(`User ${userId} has reached daily limit, removing from tracking`);
                usersToRemove.push(userId);
            }
        }

        // Remove users who can't earn more points
        for (const userId of usersToRemove) {
            this.activeVoiceSessions.delete(userId);
        }

        if (this.activeVoiceSessions.size > 0) {
            console.log(`Currently tracking ${this.activeVoiceSessions.size} users in voice channels`);
        }
    }

    // Get current active sessions (for debugging)
    getActiveSessions() {
        return this.activeVoiceSessions;
    }
}

module.exports = PointsTimer; 
