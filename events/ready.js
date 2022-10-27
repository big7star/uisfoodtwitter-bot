const sleep = require('node:timers/promises').setTimeout;
const { EmbedBuilder } = require('discord.js');
const { request } = require('undici');

module.exports = {
	name: 'ready',
	async execute(client) {
		console.log('Ready status reported.');

		let timeUntilNextCheck = 1_000;
		let latestTweetId = null;
		while (true) {
			console.log(`Waiting ${timeUntilNextCheck}ms until next check`);
			await sleep(timeUntilNextCheck);

			timeUntilNextCheck = 900_000;

			const res = await request(
				`https://api.twitter.com/2/users/${process.env.TWITTER_UISFOODSERVICE_ACCOUNT_ID}/tweets`,
				{
					method: 'GET',
					headers: {
						authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
					},
				}
			);
			if (res.statusCode !== 200) continue;

			const bodyJson = await res.body.json();
			if (latestTweetId === bodyJson.meta.newest_id) continue;

			latestTweetId = bodyJson.meta.newest_id;
			let tweetText = bodyJson.data[0].text;

			tweetText = tweetText.replace(/&\w+;/g, '&');

			const soups = tweetText.match(/(?<=are\s).+(?=;)/);
			const lunchEntrees = tweetText.match(/(?<=Lunch.).+(?=;.)/i);
			const dinnerEntrees = tweetText.match(/(?<=Dinner.).+(?=;)/i);
			const worldflavors = tweetText.match(/(?<=serving\s).+(?=.\s)/i);

			const embed = new EmbedBuilder()
				.setColor('#003366')
				.setThumbnail(
					'https://pbs.twimg.com/profile_images/835940195/foodservice_400x400.jpg'
				)
				.setURL(`https://twitter.com/uisfoodservice/status/${latestTweetId}`)
				.setTitle(`UIS Food Studio Menu for ${new Date().toDateString()}`)
				.addFields(
					{ name: 'Soups of the Day', value: `${soups}`, inline: false },
					{ name: 'Lunch Entrees', value: `${lunchEntrees}`, inline: true },
					{ name: 'Dinner Entrees', value: `${dinnerEntrees}`, inline: true },
					{ name: 'World Flavors', value: `${worldflavors}`, inline: false }
				)
				.setTimestamp();

			client.channels.cache
				.get(process.env.DISCORD_LOG_CHANNEL_ID)
				.send({ embeds: [embed] });
		}
	},
};
