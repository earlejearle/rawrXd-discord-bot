const { SlashCommandBuilder } = require('@discordjs/builders');
const { Collection, CommandInteractionOptionResolver, UserFlags } = require('discord.js');
const fs = require('node:fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('refresh')
		.setDescription('Refresh scoreboard for current month.'),
	async execute(interaction) {

		// Function to fetch > 100 messages
		async function fetchMore(channel, limit = 250) {
			if (!channel) {
			  throw new Error(`Expected channel, got ${typeof channel}.`);
			}
			if (limit <= 100) {
			  return channel.messages.fetch({ limit });
			}
		  
			let collection = new Collection();
			let lastId = null;
			let options = {};
			let remaining = limit;
		  
			while (remaining > 0) {
			  options.limit = remaining > 100 ? 100 : remaining;
			  remaining = remaining > 100 ? remaining - 100 : 0;
		  
			  if (lastId) {
				options.before = lastId;
			  }
		  
			  let messages = await channel.messages.fetch(options);
		  
			  if (!messages.last()) {
				break;
			  }
		  
			  collection = collection.concat(messages);
			  lastId = messages.last().id;
			}
		  
			return collection;
		}

		// Get collection of messages
		let messages = await fetchMore(interaction.channel, 400);

		// Look for Wordle submissions and add to submissions array
		const currentMonth = new Date().getMonth();
		messages = messages.filter(message => (message.content.startsWith('Wordle') && (message.createdAt.getMonth() === currentMonth)));
		const submissions = [];

		messages.each(message => {
			const author = message.author.id;
			let guesses = message.content.at(11);

			// Convert score to integer
			if (guesses === 'X') {
				guesses = 7;
			} else {
				guesses = parseInt(guesses);
			}

			submissions.push({ author: author, guesses: guesses });
		});

		messages = [];
		
		// Create array with all user ids
		const users = [];
		submissions.forEach(submission => {
			if (users.indexOf(submission.author) === -1) {
				users.push(submission.author);
			}
		});

		// Initialise scores array for each user
		const scores = [];
		users.forEach(user => {
			scores.push({ id: user, guesses: 0, submissions: 0 });
		});

		// Update scores with all submissions
		submissions.forEach(submission => {
			scores.forEach(user => {
				if (submission.author === user.id) {
					user.guesses += submission.guesses;
					user.submissions++;
				}
			})
		});

		// Finally, convert array of objects to json file
		const jsonContent = JSON.stringify(scores);

		fs.writeFile("./scores.json", jsonContent, 'utf-8', function (err) {
			if (err) {
				return console.log(err);
			}

			console.log("The file was saved!");
		});

		await interaction.reply('Scores have been updated!');
	},
};

