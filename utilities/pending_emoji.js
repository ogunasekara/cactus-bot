const fs = require('node:fs');
const path = require('node:path');

// File to store pending emoji data
let PENDING_FILE = path.join(__dirname, '../data/pending_emoji.json');

// Ensure data directory exists
const dataDir = path.dirname(PENDING_FILE);
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(PENDING_FILE)) {
	fs.writeFileSync(PENDING_FILE, JSON.stringify({}));
}

// Load pending emoji data from file
function loadPending() {
	try {
		const data = fs.readFileSync(PENDING_FILE, 'utf8');
		return JSON.parse(data);
	} catch (error) {
		console.error('Error loading pending emoji data:', error);
		return {};
	}
}

// Save pending emoji data to file
function savePending(pendingData) {
	try {
		fs.writeFileSync(PENDING_FILE, JSON.stringify(pendingData, null, 2));
	} catch (error) {
		console.error('Error saving pending emoji data:', error);
	}
}

// Add a pending emoji request
function addPending({ messageId, channelId, guildId, emojiName, fileUrl, submittedBy, submittedAt }) {
	const pendingData = loadPending();
	pendingData[messageId] = {
		messageId,
		channelId,
		guildId,
		emojiName,
		fileUrl,
		submittedBy,
		submittedAt: submittedAt || new Date().toISOString(),
		status: 'pending',
	};
	savePending(pendingData);
}

// Get a pending emoji request (only if status is 'pending')
function getPending(messageId) {
	const pendingData = loadPending();
	const entry = pendingData[messageId];
	if (entry && entry.status === 'pending') {
		return entry;
	}
	return null;
}

// Update the status of a pending emoji request
function updateStatus(messageId, status) {
	const pendingData = loadPending();
	if (pendingData[messageId]) {
		pendingData[messageId].status = status;
		savePending(pendingData);
		return true;
	}
	return false;
}

// Remove a pending emoji request
function removePending(messageId) {
	const pendingData = loadPending();
	if (pendingData[messageId]) {
		delete pendingData[messageId];
		savePending(pendingData);
		return true;
	}
	return false;
}

// Get all pending emoji requests (only status === 'pending')
function getAllPending() {
	const pendingData = loadPending();
	return Object.values(pendingData).filter(entry => entry.status === 'pending');
}

// Clear all pending data (for testing)
function clearAll() {
	savePending({});
}

module.exports = {
	addPending,
	getPending,
	updateStatus,
	removePending,
	getAllPending,
	loadPending,
	savePending,
	clearAll,
};
