// Imports
const fs = require('fs')

// Command-line args
const [, , ...args] = process.argv;

const seasonEpisodeRegex = /'[sS](\d\d)[eE](\d\d)'/g;
const seasonInfo = JSON.parse(fs.readFileSync(args[1]));
const files = fs.readdirSync(args[0]);

console.log(seasonInfo.season);
console.log(seasonInfo.year);
seasonInfo.episodes.forEach(episode => console.log(episode));

files.forEach((file, idx) => {
    console.log(`index: ${idx}`);
    console.log(`file: ${file}`);

    const matches = file.match(seasonEpisodeRegex);
    console.log(matches);
    if (matches)
        matches.forEach(match => console.log(match));
});