# Plex-Scripts
Contains helper scripts for organizing your plex media library

# Currently Supported Scripts
## plex_rename_tv_season ##
To Install:
1. Make sure you have Node installed
2. Navigate to rename_tv_season
3. Run `npm i -g .` to install the scripts (sudo/admin permission may be necessary)

To Use:
- The script can be run from anywhere with the command `plex_rename_tv_season`

Parameters:
- --directory/-d: The path to the directory containing *episode* files (ex. './Cowboy Bebop/Season 01')
- --name/-n: The name of the TV show which the season belongs to (ex. 'Cowboy Bebop')
- --year/-y: The year the first episode of the TV show aired (ex. 1998)

Note:
- Only .srt file types are supported for subtitles at the moment