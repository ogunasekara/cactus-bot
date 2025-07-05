const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTotalPoints, getDailyPoints, getLeaderboard, canEarnPointsToday } = require('../../utilities/cactus_points.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('points')
		.setDescription('Check your cactus points or view the leaderboard')
		.addSubcommand(subcommand =>
			subcommand
				.setName('check')
				.setDescription('Check your cactus points')
				.addUserOption(option =>
					option
						.setName('user')
						.setDescription('User to check points for (defaults to yourself)')
						.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('leaderboard')
				.setDescription('View the cactus points leaderboard')),
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		
		if (subcommand === 'check') {
			const targetUser = interaction.options.getUser('user') || interaction.user;
			const totalPoints = getTotalPoints(targetUser.id);
			const dailyPoints = getDailyPoints(targetUser.id);
			const canEarn = canEarnPointsToday(targetUser.id);
			const remainingDaily = Math.max(0, 100 - dailyPoints);
			
			const embed = new EmbedBuilder()
				.setColor(0x00ff00)
				.setTitle('🌵 Cactus Points')
				.setThumbnail(targetUser.displayAvatarURL())
				.addFields(
					{ name: 'User', value: targetUser.username, inline: true },
					{ name: 'Total Points', value: totalPoints.toString(), inline: true },
					{ name: 'Today\'s Points', value: `${dailyPoints}/100`, inline: true },
					{ name: 'Remaining Today', value: remainingDaily.toString(), inline: true },
					{ name: 'Can Earn More', value: canEarn ? '✅ Yes' : '❌ No', inline: true }
				)
				.setFooter({ text: 'Earn points by being in voice channels! (1 point per minute, max 100 per day)' })
				.setTimestamp();
			
			await interaction.reply({ embeds: [embed] });
		}
		else if (subcommand === 'leaderboard') {
			const leaderboard = getLeaderboard(10);
			
			if (leaderboard.length === 0) {
				await interaction.reply('No cactus points have been earned yet! Join voice channels to start earning points.');
				return;
			}
			
			const embed = new EmbedBuilder()
				.setColor(0x00ff00)
				.setTitle('🌵 Cactus Points Leaderboard')
				.setDescription('Top 10 users by total points')
				.setFooter({ text: 'Updated in real-time' })
				.setTimestamp();
			
			let leaderboardText = '';
			for (let i = 0; i < leaderboard.length; i++) {
				const entry = leaderboard[i];
				const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
				const username = user ? user.username : `Unknown User (${entry.userId})`;
				
				const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
				leaderboardText += `${medal} **${username}** - ${entry.total} points\n`;
			}
			
			embed.setDescription(leaderboardText);
			
			await interaction.reply({ embeds: [embed] });
		}
	},
}; 
