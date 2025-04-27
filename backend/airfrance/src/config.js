const path = require("path");

// Configuration constants
const CONFIG = {
  // Path to cookies file
  COOKIES_FILE: path.join(__dirname, "..", "cookies.json"),

  // Default search parameters
  DEFAULT_SEARCH: {
    origin: "NYC",
    destination: "PAR",
    departureDate: "2025-09-07",
  },

  // Login timeout settings
  LOGIN_TIMEOUT: {
    maxAttempts: 60, // 10 minutes total (10 seconds * 60)
    checkInterval: 10000, // Check every 10 seconds
    screenshotInterval: 12, // Take screenshot every 2 minutes
  },

  // Browser settings
  BROWSER: {
    refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    waitTimeout: 120000, // 2 minute timeout for navigation
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
  },

  // API settings
  API: {
    endpoint: "https://wwws.airfrance.us/gql/v1?bookingFlow=LEISURE",
    hashes: {
      lowestFares:
        "8dc693945bf8eadc1d5c80d2f3c82ce4b3f869b27e04ad356afb22516a1559e6",
      availableOffers:
        "26fd07c926aec484cd06775c68d7d3ab809ca7d0521683a61b213f5d6d03fe5c",
    },
  },
};

module.exports = { CONFIG };
