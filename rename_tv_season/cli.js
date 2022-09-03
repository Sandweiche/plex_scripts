// Imports
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')();

// Process command-line args
const [, , ...args] = process.argv;
if (args.length !== 6) {
	console.error('Invalid number of command line args. Usage:\n--year/-y 1997\n--name/-n Pokemon\n--directory/-d \"./Season 01\"');
} else {
	let name;
	let year;
	let dir;
	try {
		args.forEach((arg, idx) => {
			switch (arg.toLowerCase()) {
				case '-y':
				case '--year':
					year = args[idx + 1];
					break;
				case '-n':
				case '--name':
					name = args[idx + 1];
					break;
				case '-d':
				case '--directory':
					dir = args[idx + 1];
					break;
			}
		});
	} catch (ex) {
		console.error('Invalid command line arg structure. Usage:\n--year/-y 1997\n--name/-n Pokemon\n--directory/-d \"./Season 01\"');
	}

	const SEASON_EPISODE_EXTENSION_REGEX = /[sS](\d\d)[eE](\d\d)[^.]+(\.[a-z1-9]+)$/g;
	const RESERVED_PATH_CHARS = /[<>\.:"\/\\\|?*]+/g;

	axios.get(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(name)}`)
		.then(async response => {
			const matchedShows = response.data.filter(datum => datum.show.premiered.slice(0, 4) === year)

			console.log(`Summary:\n${matchedShows[0].show.summary}\nOption 1/${matchedShows.length}`);

			let foundIt;
			let idx = 0;
			do {
				foundIt = prompt('Does this sound correct? y/n: ');
				if (foundIt.toLowerCase() !== 'y' && foundIt.toLowerCase() !== 'n') {
					console.log('Unrecognized input - one of \'y\' or \'n\' only, please.');
					continue;
				} else if (foundIt.toLowerCase() !== 'y') {
					++idx;
					try {
						console.log(`Summary:\n${matchedShows[idx].show.summary}\nOption ${idx + 1}/${matchedShows.length}`);
					} catch {
						console.log('End of options. Terminating process in 5 seconds. Press Ctrl + C to exit early.');
						await new Promise(resolve => setTimeout(resolve, 5000));
						process.exit();
					}
				}
			} while (foundIt.toLowerCase() !== 'y');

			const files = fs.readdirSync(dir);

			files.forEach(file => {
				const matches = file.matchAll(SEASON_EPISODE_EXTENSION_REGEX);
				for (const match of matches) {
					const season = match[1];
					const episode = match[2];
					const ext = match[3];

					axios.get(`https://api.tvmaze.com/shows/${response.data[0].show.id}/episodebynumber?season=${parseInt(season)}&number=${parseInt(episode)}`)
						.then(response => {
							response.data.name = response.data.name.replace(RESERVED_PATH_CHARS, '');

							const newName = path.join(__dirname, dir, `${name} (${year})-s${season}e${episode}-${response.data.name}${ext}`);
							const oldName = path.join(__dirname, dir, file)

							fs.rename(oldName, newName, error => {
								if (error)
									console.error(error);
								else
									console.log(`Renamed: ${oldName} -> ${newName}`);
							});
						})
						.catch(error => {
							console.error(error);
						});
				}
			});
		})
		.catch(error => {
			console.error(error);
		});
}