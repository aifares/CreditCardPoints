# Virgin Atlantic Flight Search

This module handles searching for award flights on Virgin Atlantic by:

1. Authenticating with Virgin Atlantic
2. Retrieving cookies for authenticated API requests
3. Searching for available award flights
4. Processing and formatting the flight data

## File Structure

- `config.js` - Configuration settings (credentials, proxy settings, URLs)
- `auth.js` - Authentication and cookie handling
- `api.js` - API calls to search for flights
- `formatter.js` - Format the API response data
- `index.js` - Main entry point that orchestrates the whole process
- `Virgin.js` - Legacy file that now imports from the new modular structure

## Usage

```bash
# Run the main script
node backend/virgin-atlantic/index.js
```

## Output Files

- `cookies.json` - Authentication cookies saved for reuse
- `virgin.json` - Raw API response data
- `virginFlights.json` - Processed and formatted flight data

## Modifying Search Parameters

To modify the search parameters, edit the `defaultSearch` object in `config.js`:

```javascript
defaultSearch: {
  origin: "JFK",
  destination: "LHR",
  departureDate: "2025-04-27",
}
```

## Security Note

This code contains credentials for demonstration purposes. In a production environment:

- Store credentials in environment variables or a secure vault
- Do not commit credentials to version control
