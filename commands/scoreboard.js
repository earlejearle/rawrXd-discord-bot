const { SlashCommandBuilder } = require('@discordjs/builders');
const { Collection } = require('discord.js');
const fs = require('node:fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('scoreboard')
		.setDescription('Show the current scoreboard.'),
	async execute(interaction) {

		// Load scores from scores.json file
		let scores = [];
		fs.readFile('./scores.json', 'utf-8', (err, fileContent) => {
			if (fileContent === undefined) {
				console.log(err);
				interaction.reply('No scores saved. Use /refresh and try again!');
			} else {
				scores = JSON.parse(fileContent);

				// Subtract 10 points for every missed submission
				for (const user of scores) {
					const currentDate = new Date();
					const missedDays = (currentDate.getDate() -1) - user.submissions;

					if (missedDays) {
						user.guesses += missedDays * 10;
					}
				}
				console.log(scores);

				reply = ':trophy: Current Leaderboard :trophy:';

				// Sort scores from lowest score to highest score
				function compare( a, b ) {
					if ( a.guesses < b.guesses ){
					  return -1;
					}
					if ( a.guesses > b.guesses ){
					  return 1;
					}
					return 0;
				  }
				  scores.sort( compare );

				  // Add score to leaderboard reply
				  for (let i = 0; i < scores.length; i++) {
					reply += `\n${ i + 1 }. <@${scores[i].id}> ---> ${scores[i].guesses} guesses`;
				  }
				
				interaction.reply(reply);
			}
		})
	},
};

