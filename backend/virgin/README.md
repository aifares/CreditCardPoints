# Virgin Atlantic API Client

A modular client for interacting with Virgin Atlantic's website to search for award flights.

## File Structure

- `index.js` - Main entry point that orchestrates the entire process
- `config.js` - Configuration settings (proxy, credentials, URLs, etc.)
- `login.js` - Handles authentication including email verification
- `api.js` - Provides functions for interacting with Virgin Atlantic's API
- `utils.js` - Utility functions for data handling
- `emailUtils.js` - Functions for retrieving verification codes from email
- `run.js` - Example script for custom searches

## Installation

Install the required dependencies:

```
npm install
```

## Email Verification Automation

The system now supports automated email verification:

1. When Virgin Atlantic requires email verification, the script will:

   - Click the "Send verification code" button
   - Automatically check your email for the verification code
   - Extract and enter the code
   - Click the verify button

2. If automatic verification fails, the system falls back to manual entry.

## Usage

1. Run the script:

   ```
   npm start
   ```

   or

   ```
   node index.js
   ```

2. The script will:
   - Launch a browser with the configured proxy
   - Login to Virgin Atlantic using your credentials
   - Handle email verification automatically
   - Save cookies to `cookies.json`
   - Search for award flights with the default parameters
   - Save the flight data to `virgin.json`

## Custom Flight Searches

You can run custom searches after login:

```bash
npm run custom
```

Or create your own custom search:

```javascript
const { searchAwardFlights } = require("./index");
const { loadJson } = require("./utils");

async function customSearch() {
  // Load previously saved cookies
  const cookies = loadJson("cookies.json");

  if (!cookies) {
    console.error("No cookies found. Run the login process first.");
    return;
  }

  // Search for flights
  const result = await searchAwardFlights(
    {
      origin: "SFO",
      destination: "LHR",
      departureDate: "2025-05-15",
    },
    cookies
  );

  console.log(result);
}

customSearch();
```

## Configuration

Edit the `config.js` file to modify:

- Proxy settings
- Login credentials
- Email settings for verification
- Timeouts
- API URLs
