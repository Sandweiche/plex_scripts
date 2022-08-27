// Imports
const fs = require('fs');
const path = require('path');

// Command-line args
const [, , ...args] = process.argv;
seasonDirectory = args[0];

const seasonEpisodeRegex = /[sS](\d\d)[eE](\d\d)/g;
const showInfo = JSON.parse(fs.readFileSync(args[1]));
const files = fs.readdirSync(seasonDirectory);

console.log(showInfo.name);
console.log(showInfo.year);
showInfo.episodes.forEach(episode => console.log(episode));

files.forEach((file, idx) => {
	console.log(`\nindex: ${idx}`);
	console.log(`file: ${file}`);

	const matches = file.matchAll(seasonEpisodeRegex);
	for (const match of matches) {
		const season = match[1];
		const episode = match[2];

		fs.renameSync(path.join(__dirname, seasonDirectory, file), path.join(__dirname, seasonDirectory, `${showInfo.name} (${showInfo.year})-s${season}e${episode}-${showInfo.episodes[episode-1]}`));
	}
});