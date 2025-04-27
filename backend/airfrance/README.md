# Air France Rewards Automation

This script automates the process of searching for Air France rewards flights. It handles cookie authentication, browser interaction, and provides an interactive command line interface for searching flights.

## Features

- Cookie-based authentication
- Automatic cookie refreshing (every 5 minutes)
- Interactive flight search via command line
- Uses two different API methods for comprehensive search results
- JSON result files for each search
- Automatic session maintenance

## Prerequisites

- Node.js installed
- Playwright installed (`npm install playwright`)
- Valid Air France account
- A `cookies.json` file from a logged-in session

## Setup

1. Make sure you have a valid `cookies.json` file in the main directory
2. Install dependencies: `npm install playwright readline`
3. Run the script: `node index.js`

## Usage

The script opens a browser window and maintains your Air France session automatically. You can interact with it via the terminal:

### Commands

- `search <origin> <destination> <date>`: Search for flights
  - Example: `search NYC PAR 2025-09-07`
  - Use airport or city codes for origin and destination
  - Date format: YYYY-MM-DD
- `refresh`: Manually refresh the page and update cookies

- `status`: Check if you're still logged in

- `help`: Show available commands

### Search Results

Search results are saved as JSON files in the current directory:

- `search-result-[origin]-[destination]-[date]-api1.json`: Detailed flight offers
- `search-result-[origin]-[destination]-[date]-api2.json`: Date-based lowest fare offers

## File Structure

- `index.js`: Main entry point
- `src/automation.js`: Core automation logic
- `src/config.js`: Configuration settings
- `src/commands.js`: Command handling
- `src/navigation.js`: Page navigation functions
- `src/search.js`: Flight search functionality

## Troubleshooting

If you encounter login issues:

1. Open Air France website manually and login
2. Export cookies to a `cookies.json` file
3. Place the file in the same directory as the script

If search fails:

1. Check that you're using valid airport/city codes
2. Verify your login is still active with the `status` command
3. Try the `refresh` command to refresh your session
