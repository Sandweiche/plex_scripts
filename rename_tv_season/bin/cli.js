#!/usr/bin/env node

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
				case '-d':
				case '--directory':
					dir = args[idx + 1];
					break;
				case '-n':
				case '--name':
					name = args[idx + 1];
					break;
				case '-y':
				case '--year':
					year = args[idx + 1];
					break;
			}
		});
	} catch (ex) {
		console.error('Invalid command line arg structure. Usage:\n--year/-y 1997\n--name/-n Pokemon\n--directory/-d \"./Season 01\"');
	}

	// Get a list of matching shows (sorted by relevance) and allow the user to select which one to use. 
	// If none are chosen the program exits without making changes
	axios.get(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(name)}`)
		.then(async response => {
			const matchedShows = response.data.filter(datum => datum.show.premiered.slice(0, 4) === year)

			if (matchedShows.length > 0)
				console.log(`Summary:\n${matchedShows[0].show.summary}\nOption 1/${matchedShows.length}`);
			else {
				console.log('No matches found. Terminating process in 5 seconds. Press Ctrl + C to exit early.');
				await new Promise(resolve => setTimeout(resolve, 5000));
				process.exit();
			}

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

			// Read the file names from the directory
			let files;
			try {
				files = fs.readdirSync(dir);
			} catch (ex) {
				console.error(ex)
				console.log('End of options. Terminating process in 5 seconds. Press Ctrl + C to exit early.');
				await new Promise(resolve => setTimeout(resolve, 5000));
				process.exit();
			}

			// Array<{ episode: String, extension: String, oldName: String, uri: String, season: String }>
			reqInfo = [];
			// Array<String>
			errors = [];
			const SEASON_EPISODE_EXTENSION_REGEX = /[sS](\d\d)[eE](\d\d).*(\.[a-z1-9]+)$/g;
			const RESERVED_PATH_CHARS = /[<>\.:"\/\\\|?*]+/g;

			// Populate reqInfo array
			files.forEach(file => {
				const matches = [...file.matchAll(SEASON_EPISODE_EXTENSION_REGEX)];

				if (!matches)
					errors.push(`No matches in file: ${file}`)

				for (const match of matches) {
					const episode = match[2]
					const season = match[1]
					// Append .en when renaming subtitle files
					const extension = match[3] === '.srt' ? `.en${match[3]}` : match[3]

					reqInfo.push({
						episode: episode,
						extension: extension,
						oldName: file,
						uri: `https://api.tvmaze.com/shows/${response.data[0].show.id}/episodebynumber?season=${parseInt(season)}&number=${parseInt(episode)}`,
						season: season
					});
				}
			});

			// Get the episode names and then rename the files
			const requests = [];
			reqInfo.map(req => req.uri).forEach(uri => {
				requests.push(axios.get(uri));
			});
			Promise.allSettled(requests).then((responses) => {
				responses.forEach((response, index) => {
					if (response.status === 'fulfilled') {
						const showName = response.value.data.name.replace(RESERVED_PATH_CHARS, '');

						const newName = path.join(dir, `${name} (${year})-s${reqInfo[index].season}e${reqInfo[index].episode}-${showName}${reqInfo[index].extension}`);
						const oldName = path.join(dir, reqInfo[index].oldName);

						fs.renameSync(oldName, newName)
						console.log(`Renamed: ${oldName} -> ${newName}`);
					} else {
						errors.push(`Couldn't rename ${reqInfo[index].oldName} - Reason: ${response.reason.response.data.message}\nPossible Causes:\n- It's a special and isn't necessarily tied to an episode number\n- It's a multi-part episode\n- A million other things\nSee The TVMaze API Documentation here: https://www.tvmaze.com/api#episode-by-number`);
					}
				});

				// Report any errors that shouldn't have stopped the execution
				console.log()
				for (const err of errors)
					console.error(err);
			});
		})
		.catch(error => {
			console.error(error);
		});
}