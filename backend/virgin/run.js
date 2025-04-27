/**
 * Runner script for Virgin Atlantic API client with enhanced human-like behavior
 */

const { main, searchAwardFlights, searchWithSavedCookies } = require("./index");
const { loadJson, saveJson } = require("./utils");
const config = require("./config");

// Disable proxy based on command line flag
if (process.argv.includes("--no-proxy")) {
  console.log("🚫 Running without proxy (proxy disabled)");
  config.proxy = null;
} else {
  console.log(`🔒 Using proxy: ${config.proxy.server}`);
}

// Configure headless mode based on command line flag
if (process.argv.includes("--headless")) {
  console.log("🤖 Running in headless mode (browser will not be visible)");
  process.env.HEADLESS = "true";
} else {
  console.log("👁️ Running in visible mode (browser will be visible)");
  process.env.HEADLESS = "false";
}

// Example of running a search with custom parameters after loading cookies
async function customSearch() {
  try {
    console.log("Loading saved cookies...");
    const cookies = loadJson("cookies.json");

    if (!cookies || !cookies.length) {
      console.error(
        "❌ No cookies found or invalid format. Run the full login process first."
      );
      return;
    }

    console.log(`✅ Found ${cookies.length} saved cookies.`);
    console.log("Searching for flights with custom parameters...");

    // Allow command line arguments to override search parameters
    let origin = "JFK"; // Default
    let destination = "LHR"; // Default
    let departureDate = "2025-05-27"; // Default

    // Parse command line args for search parameters
    process.argv.forEach((arg) => {
      if (arg.startsWith("--from=")) origin = arg.split("=")[1];
      if (arg.startsWith("--to=")) destination = arg.split("=")[1];
      if (arg.startsWith("--date=")) departureDate = arg.split("=")[1];
    });

    // Example custom search for flights
    const searchParams = {
      origin: origin,
      destination: destination,
      departureDate: departureDate,
    };

    console.log(
      `🔍 Searching for: ${origin} → ${destination} on ${departureDate}`
    );

    // Use the searchWithSavedCookies function which creates its own API context
    const result = await searchWithSavedCookies(searchParams, cookies);

    if (result) {
      console.log("✅ Custom search completed successfully");
      const fileName = `${origin}-${destination}-${departureDate}.json`;
      saveJson(fileName, result);
      console.log(`✅ Results saved to ${fileName}`);

      // Log a summary of the results
      try {
        const flightCount = result.journeys?.[0]?.flights?.length || 0;
        console.log(`Found ${flightCount} flight options`);

        if (flightCount > 0) {
          console.log("\nFlight Summary:");
          result.journeys[0].flights.forEach((flight, index) => {
            const departureTime = flight.departureTime;
            const arrivalTime = flight.arrivalTime;
            const carrier = flight.marketingCarrier;
            const duration = flight.duration;
            const aircraft = flight.aircraft?.name || "Unknown";

            console.log(
              `${
                index + 1
              }. ${carrier} | ${departureTime} - ${arrivalTime} | Duration: ${duration} | Aircraft: ${aircraft}`
            );
          });
        }
      } catch (error) {
        console.log("Unable to print flight summary:", error.message);
      }
    } else {
      console.error("❌ Custom search failed - no results returned");
    }
  } catch (error) {
    console.error("Error in custom search:", error);
  }
}

// Execute based on command line argument
if (process.argv.includes("--custom")) {
  console.log("Running custom search with saved cookies...");
  customSearch();
} else if (process.argv.includes("--help")) {
  console.log(`
Virgin Atlantic Search Tool - Usage:
----------------------------------
Run full process (login, save cookies, search):
  node run.js

Run custom search with saved cookies:
  node run.js --custom [options]

Options:
  --no-proxy      Disable proxy usage
  --headless      Run in headless mode (browser not visible)
  --from=XXX      Origin airport code (e.g. --from=SFO)
  --to=XXX        Destination airport code (e.g. --to=LHR)
  --date=YYYY-MM-DD  Departure date (e.g. --date=2025-06-15)
  --help          Show this help message
  `);
} else {
  console.log("Running full process (login, save cookies, default search)...");
  main();
}
