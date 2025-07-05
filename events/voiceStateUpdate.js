const { Events } = require('discord.js');
const { addPoints, canEarnPointsToday } = require('../utilities/cactus_points.js');

// Store active voice sessions
const activeVoiceSessions = new Map();

module.exports = {
	name: Events.VoiceStateUpdate,
	async execute(oldState, newState) {
		const userId = newState.member.user.id;
		
		// User joined a voice channel
		if (!oldState.channelId && newState.channelId) {
			console.log(`User ${newState.member.user.username} joined voice channel: ${newState.channel.name}`);
			
			// Check if user can earn points today
			if (canEarnPointsToday(userId)) {
				// Start tracking this user's voice session
				activeVoiceSessions.set(userId, {
					channelId: newState.channelId,
					channelName: newState.channel.name,
					joinTime: Date.now(),
					lastPointTime: Date.now()
				});
				
				console.log(`Started tracking voice session for ${newState.member.user.username}`);
			} else {
				console.log(`User ${newState.member.user.username} has already reached daily limit`);
			}
		}
		
		// User left a voice channel
		if (oldState.channelId && !newState.channelId) {
			console.log(`User ${oldState.member.user.username} left voice channel: ${oldState.channel.name}`);
			
			// Remove from active sessions
			if (activeVoiceSessions.has(userId)) {
				const session = activeVoiceSessions.get(userId);
				const timeInChannel = Date.now() - session.joinTime;
				const minutesInChannel = Math.floor(timeInChannel / (1000 * 60));
				
				console.log(`User ${oldState.member.user.username} was in voice for ${minutesInChannel} minutes`);
				activeVoiceSessions.delete(userId);
			}
		}
		
		// User moved between voice channels
		if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
			console.log(`User ${newState.member.user.username} moved from ${oldState.channel.name} to ${newState.channel.name}`);
			
			// Update the session with new channel info
			if (activeVoiceSessions.has(userId)) {
				const session = activeVoiceSessions.get(userId);
				session.channelId = newState.channelId;
				session.channelName = newState.channel.name;
			}
		}
	},
};

// Export the activeVoiceSessions map so it can be accessed by the points timer
module.exports.activeVoiceSessions = activeVoiceSessions;

// Function to set the timer reference (called from ready event)
module.exports.setTimer = function(timer) {
    timer.setActiveVoiceSessions(activeVoiceSessions);
}; 
