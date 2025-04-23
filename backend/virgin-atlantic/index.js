const fs = require("fs");
const path = require("path");
const { authenticate } = require("./auth");
const { searchAwardFlights } = require("./api");
const { formatFlightResults } = require("./formatter");
const config = require("./config");

/**
 * Main function to execute the Virgin Atlantic search process
 */
async function main() {
  let browser;

  try {
    // Step 1: Authenticate and get cookies
    console.log("Authenticating with Virgin Atlantic...");
    const authResult = await authenticate();
    browser = authResult.browser;
    const { cookieHeader } = authResult;

    // Step 2: Search for flights
    console.log("Searching for award flights...");
    const searchParams = config.defaultSearch;
    const flightData = await searchAwardFlights(searchParams, cookieHeader);

    // Step 3: Save raw API response
    const outputDir = __dirname;
    fs.writeFileSync(
      path.join(outputDir, "virgin.json"),
      JSON.stringify(flightData, null, 2),
      "utf-8"
    );
    console.log(
      `✅ Raw API response saved to ${path.join(outputDir, "virgin.json")}`
    );

    // Step 4: Format the results
    console.log("Formatting flight results...");
    const formatted = formatFlightResults(flightData);

    // Step 5: Save formatted results
    fs.writeFileSync(
      path.join(outputDir, "virginFlights.json"),
      JSON.stringify(formatted, null, 2),
      "utf-8"
    );
    console.log(
      `✅ Formatted results saved to ${path.join(
        outputDir,
        "virginFlights.json"
      )}`
    );
  } catch (error) {
    console.error("Error in main process:", error);
  } finally {
    // Always close the browser
    if (browser) {
      await browser.close();
      console.log("Browser closed.");
    }
  }
}

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
