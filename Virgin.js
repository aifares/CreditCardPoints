// This file is now replaced by a modular structure.
// Please use the new files:
// - config.js - Configuration settings
// - auth.js - Authentication and cookie handling
// - api.js - API calls to search for flights
// - formatter.js - Format the API response
// - index.js - Main entry point that ties everything together

// To run the application, use:
// node backend/virgin-atlantic/index.js

const { main } = require("./backend/virgin-atlantic/index");

// Run the main function when this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
