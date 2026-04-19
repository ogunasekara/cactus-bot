const { Events } = require('discord.js');
const PointsTimer = require('../utilities/points_timer.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		
		// Initialize and start the cactus points timer
		const pointsTimer = new PointsTimer();
		client.pointsTimer = pointsTimer;
		
		// Set the active voice sessions reference
		const voiceStateUpdate = require('./voiceStateUpdate.js');
		voiceStateUpdate.setTimer(pointsTimer);
		
		// Start the timer
		pointsTimer.start();
		
		console.log('Cactus points system initialized and started!');
	},
};
