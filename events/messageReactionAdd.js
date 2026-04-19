const { Events, PermissionFlagsBits } = require('discord.js');
const pendingEmoji = require('../utilities/pending_emoji.js');

module.exports = {
	name: Events.MessageReactionAdd,
	async execute(reaction, user) {
		// Ignore bot reactions
		if (user.bot) return;

		// Only handle thumbs up/down
		if (!['👍', '👎'].includes(reaction.emoji.name)) return;

		// Fetch partials if needed
		try {
			if (reaction.partial) await reaction.fetch();
			if (reaction.message.partial) await reaction.message.fetch();
		} catch (error) {
			console.error('Error fetching partial reaction/message:', error);
			return;
		}

		const messageId = reaction.message.id;

		// Check if this message is a pending emoji request
		const pending = pendingEmoji.getPending(messageId);
		if (!pending) return;

		// Fetch the reacting member and check admin permission
		let member;
		try {
			member = await reaction.message.guild.members.fetch(user.id);
		} catch (error) {
			console.error('Error fetching member:', error);
			return;
		}

		if (!member.permissions.has(PermissionFlagsBits.Administrator)) return;

		if (reaction.emoji.name === '👍') {
			try {
				const emoji = await reaction.message.guild.emojis.create({
					attachment: pending.fileUrl,
					name: pending.emojiName,
				});
				pendingEmoji.updateStatus(messageId, 'approved');
				await reaction.message.reply(`Emoji ${emoji} created!`);
			} catch (error) {
				await reaction.message.reply(`Error creating emoji: ${error}`);
			}
		} else {
			pendingEmoji.updateStatus(messageId, 'denied');
			await reaction.message.reply(`Emoji ${pending.emojiName} denied!`);
		}
	},
};
