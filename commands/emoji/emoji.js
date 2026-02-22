const { SlashCommandBuilder } = require('discord.js');
const pendingEmoji = require('../../utilities/pending_emoji.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('emoji')
		.setDescription('Run this command with an attached image suited to be an emoji. Moderators will approve the emoji.')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The name of the emoji to create.')
				.setRequired(true))
		.addAttachmentOption(option =>
			option.setName('emoji')
				.setDescription('The attachment to create the emoji from.')
				.setRequired(true)),

	async execute(interaction) {
		const emoji_name = interaction.options.getString('name');
		const emoji_file = interaction.options.getAttachment('emoji');

		// refresh guild cache
		await interaction.guild.emojis.fetch();

		// check if name is properly formatted
		if (!emoji_name.match(/^[\w\d_]{2,}$/)) {
			interaction.reply(`Improper name ${emoji_name} provided! Name must be at least 2 characters long and contain only alphanumeric characters or underscores.`);
			return;
		}

		// check name not already in use
		for (const e of interaction.guild.emojis.cache.values()) {
			if (emoji_name === e.name) {
				interaction.reply('Emoji name already in use!');
				return;
			}
		}

		// check filetype
		if (emoji_file.contentType != 'image/png'
			&& emoji_file.contentType != 'image/jpg'
			&& emoji_file.contentType != 'image/jpeg'
			&& emoji_file.contentType != 'image/gif') {
			interaction.reply('Incompatible file type! Please use a .png, .jpg, or .gif file.');
			return;
		}

		// check file size
		if (emoji_file.size / 1024 > 256) {
			interaction.reply('File is too large! Please use a file less than 256kb.');
			return;
		}

		const message = await interaction.reply({ content: `${emoji_name} pending mod approval...`, files: [emoji_file], fetchReply: true });
		await message.react('👍').then(() => message.react('👎'));

		// Save to persistent pending storage for approval via reactions
		pendingEmoji.addPending({
			messageId: message.id,
			channelId: message.channelId,
			guildId: interaction.guildId,
			emojiName: emoji_name,
			fileUrl: emoji_file.url,
			submittedBy: interaction.user.id,
		});
	},
};
