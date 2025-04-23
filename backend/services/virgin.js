const fs = require("fs");
const path = require("path");
const { main } = require('../virgin-atlantic/index');

/**
 * Fetch Virgin Atlantic flight data
 * @param {Object} options - Options for the search
 * @returns {Promise<Array>} - Formatted flight results
 */
async function fetchVirginFlights(options = {}) {
  try {
    console.log("[VIRGIN] fetchVirginFlights called with options:", JSON.stringify(options, null, 2));
    
    // Check if the virgin-atlantic directory exists
    const virginDir = path.join(__dirname, '..', 'virgin-atlantic');
    if (!fs.existsSync(virginDir)) {
      console.error("[VIRGIN] Error: virgin-atlantic directory does not exist at", virginDir);
      return [];
    }
    
    try {
      // Call the main function from Virgin Atlantic module
      console.log("[VIRGIN] Calling main() function from virgin-atlantic module");
      await main();
      console.log("[VIRGIN] Successfully called virgin-atlantic main() function");
    } catch (mainError) {
      console.error("[VIRGIN] Error calling virgin-atlantic main() function:", mainError.message);
      console.error("[VIRGIN] Error stack:", mainError.stack);
      
      // Continue to try reading existing results even if the main() call fails
      console.log("[VIRGIN] Will attempt to read existing results file despite main() failure");
    }
    
    // Read the formatted results
    const resultsPath = path.join(__dirname, '..', 'virgin-atlantic', 'virginFlights.json');
    console.log("[VIRGIN] Checking for Virgin Atlantic results file at", resultsPath);
    
    if (fs.existsSync(resultsPath)) {
      console.log("[VIRGIN] Results file found, reading contents");
      try {
        const virginResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        console.log(`[VIRGIN] Successfully read ${virginResults.length} Virgin Atlantic flight results`);
        
        // Add airline code to each result
        const enhancedResults = virginResults.map(flight => ({
          ...flight,
          airlineCode: "VS" // Virgin Atlantic airline code
        }));
        
        return enhancedResults;
      } catch (readError) {
        console.error("[VIRGIN] Error parsing Virgin Atlantic results file:", readError.message);
        console.error("[VIRGIN] Error stack:", readError.stack);
        return [];
      }
    } else {
      console.log("[VIRGIN] No Virgin Atlantic results file found at", resultsPath);
      
      // Check for alternative file name
      const altResultsPath = path.join(__dirname, '..', 'virgin-atlantic', 'results.json');
      console.log("[VIRGIN] Checking for alternate results file at", altResultsPath);
      
      if (fs.existsSync(altResultsPath)) {
        console.log("[VIRGIN] Alternate results file found, reading contents");
        try {
          const virginResults = JSON.parse(fs.readFileSync(altResultsPath, 'utf8'));
          console.log(`[VIRGIN] Successfully read ${virginResults.length} Virgin Atlantic flight results from alternate file`);
          
          // Add airline code to each result
          const enhancedResults = virginResults.map(flight => ({
            ...flight,
            airlineCode: "VS" // Virgin Atlantic airline code
          }));
          
          return enhancedResults;
        } catch (readError) {
          console.error("[VIRGIN] Error parsing Virgin Atlantic alternate results file:", readError.message);
          console.error("[VIRGIN] Error stack:", readError.stack);
          return [];
        }
      }
      
      console.log("[VIRGIN] No Virgin Atlantic results files found under any expected names");
      return [];
    }
  } catch (error) {
    console.error("[VIRGIN] General error during Virgin Atlantic flight search:", error.message);
    console.error("[VIRGIN] Error stack:", error.stack);
    return [];
  }
}

// Run directly when called from command line
if (require.main === module) {
  fetchVirginFlights()
    .then(results => {
      console.log(`Found ${results.length} Virgin Atlantic flights`);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

module.exports = {
  fetchVirginFlights
}; 