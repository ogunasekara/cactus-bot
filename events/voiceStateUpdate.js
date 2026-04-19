const { Events } = require('discord.js');

// Store active voice sessions
const activeVoiceSessions = new Map();

module.exports = {
	name: Events.VoiceStateUpdate,
	async execute(oldState, newState) {
		// Handle edge cases
		if (!newState.member || !newState.member.user) {
			console.log('Invalid voice state update: missing member or user');
			return;
		}

		const userId = newState.member.user.id;

		// User joined a voice channel
		if (!oldState.channelId && newState.channelId) {
			const channelName = newState.channel ? newState.channel.name : 'Unknown Channel';
			console.log(`User ${newState.member.user.username} joined voice channel: ${channelName}`);

			// Start tracking this user's voice session
			activeVoiceSessions.set(userId, {
				channelId: newState.channelId,
				channelName: channelName,
				joinTime: Date.now(),
				lastPointTime: Date.now(),
			});

			console.log(`Started tracking voice session for ${newState.member.user.username}`);
		}

		// User left a voice channel
		if (oldState.channelId && !newState.channelId) {
			const oldChannelName = oldState.channel ? oldState.channel.name : 'Unknown Channel';
			console.log(`User ${oldState.member.user.username} left voice channel: ${oldChannelName}`);

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
			const oldChannelName = oldState.channel ? oldState.channel.name : 'Unknown Channel';
			const newChannelName = newState.channel ? newState.channel.name : 'Unknown Channel';
			console.log(`User ${newState.member.user.username} moved from ${oldChannelName} to ${newChannelName}`);

			// Update the session with new channel info
			if (activeVoiceSessions.has(userId)) {
				const session = activeVoiceSessions.get(userId);
				session.channelId = newState.channelId;
				session.channelName = newChannelName;
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
