/**
 * Flight search functionality for the Air France automation
 */

const fs = require("fs");
const { CONFIG } = require("./config");
const { navigateToRewardsPage } = require("./navigation");

/**
 * Perform a search with the provided parameters
 * @param {Page} page - Playwright page object
 * @param {Object} params - Search parameters (origin, destination, departureDate)
 */
async function performSearch(page, params) {
  console.log(`Performing search with parameters:`, params);

  try {
    // First navigate to the rewards search page
    const navigated = await navigateToRewardsPage(page);
    if (!navigated) {
      console.log(
        "Unable to navigate to search page. Search may not work properly."
      );
    }

    // Set up a random search state UUID
    const searchStateUuid = generateRandomUuid();

    // First try the SearchResultAvailableOffersQuery API
    console.log("Attempting first search API method...");
    try {
      // Make the first API request
      const response1 = await page.request.post(CONFIG.API.endpoint, {
        headers: {
          accept: "application/json;charset=utf-8",
          "accept-language": "en-US",
          "afkl-travel-country": "US",
          "afkl-travel-host": "AF",
          "afkl-travel-language": "en",
          "afkl-travel-market": "US",
          "content-type": "application/json",
          country: "US",
          language: "en",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-aviato-host": "wwws.airfrance.us",
          Referer: "https://wwws.airfrance.us/search/flights/0",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        data: {
          operationName: "SearchResultAvailableOffersQuery",
          variables: {
            activeConnectionIndex: 0,
            bookingFlow: "REWARD",
            availableOfferRequestBody: {
              commercialCabins: ["ECONOMY"],
              passengers: [{ id: 1, type: "ADT" }],
              requestedConnections: [
                {
                  origin: { code: params.origin, type: "CITY" },
                  destination: { code: params.destination, type: "CITY" },
                  departureDate: params.departureDate,
                },
              ],
              bookingFlow: "REWARD",
              customer: {
                selectedTravelCompanions: [
                  { passengerId: 1, travelerKey: 0, travelerSource: "PROFILE" },
                ],
              },
            },
            searchStateUuid: searchStateUuid,
          },
          extensions: {
            persistedQuery: {
              version: 1,
              sha256Hash: CONFIG.API.hashes.availableOffers,
            },
          },
        },
      });

      const result1 = await response1.json();
      const fileName1 = `search-result-${params.origin}-${params.destination}-${params.departureDate}-api1.json`;
      fs.writeFileSync(fileName1, JSON.stringify(result1, null, 2));
      console.log(
        `✅ First API search completed, results saved to ${fileName1}`
      );

      // Try to display a summary of results
      displaySearchResults(result1, "First API");
    } catch (error) {
      console.error("First API search method failed:", error.message);
    }

    // Also try the SharedSearchLowestFareOffersForSearchQuery API
    console.log("\nAttempting second search API method...");
    try {
      // Set up date interval (3 days before and after the selected date)
      const departureDate = new Date(params.departureDate);
      const startDate = new Date(departureDate);
      startDate.setDate(departureDate.getDate() - 3);
      const endDate = new Date(departureDate);
      endDate.setDate(departureDate.getDate() + 3);

      const formatDate = (date) => {
        return date.toISOString().split("T")[0];
      };

      const dateInterval = `${formatDate(startDate)}/${formatDate(endDate)}`;

      const response2 = await page.request.post(CONFIG.API.endpoint, {
        headers: {
          accept: "application/json;charset=utf-8",
          "accept-language": "en-US",
          "afkl-travel-country": "US",
          "afkl-travel-host": "AF",
          "afkl-travel-language": "en",
          "afkl-travel-market": "US",
          "content-type": "application/json",
          country: "US",
          language: "en",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-aviato-host": "wwws.airfrance.us",
          Referer: "https://wwws.airfrance.us/search/flights/0",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        data: {
          operationName: "SharedSearchLowestFareOffersForSearchQuery",
          variables: {
            lowestFareOffersRequest: {
              bookingFlow: "REWARD",
              withUpsellCabins: true,
              passengers: [{ id: 1, type: "ADT" }],
              commercialCabins: ["ECONOMY"],
              customer: {
                selectedTravelCompanions: [
                  { passengerId: 1, travelerKey: 0, travelerSource: "PROFILE" },
                ],
              },
              fareOption: null,
              type: "DAY",
              requestedConnections: [
                {
                  departureDate: params.departureDate,
                  dateInterval: dateInterval,
                  origin: { type: "CITY", code: params.origin },
                  destination: { type: "CITY", code: params.destination },
                },
              ],
            },
            activeConnection: 0,
            searchStateUuid: searchStateUuid,
            bookingFlow: "REWARD",
          },
          extensions: {
            persistedQuery: {
              version: 1,
              sha256Hash: CONFIG.API.hashes.lowestFares,
            },
          },
        },
      });

      const result2 = await response2.json();
      const fileName2 = `search-result-${params.origin}-${params.destination}-${params.departureDate}-api2.json`;
      fs.writeFileSync(fileName2, JSON.stringify(result2, null, 2));
      console.log(
        `✅ Second API search completed, results saved to ${fileName2}`
      );

      // Try to display a summary of results
      displaySearchResults(result2, "Second API");
    } catch (error) {
      console.error("Second API search method failed:", error.message);
    }

    console.log(
      "\nSearch complete. Check the generated JSON files for full details."
    );
    console.log("You can also search manually in the browser window.");
  } catch (error) {
    console.error("Error performing search:", error.message);
  }
}

/**
 * Display a summary of search results
 * @param {Object} results - Search results JSON
 * @param {string} apiName - Name of the API used
 */
function displaySearchResults(results, apiName) {
  try {
    console.log(`\n${apiName} Search Results Summary:`);

    // First API format
    if (
      results.data &&
      results.data.availableOffers &&
      results.data.availableOffers.offers
    ) {
      const offers = results.data.availableOffers.offers;
      console.log(`Found ${offers.length} offers:`);

      offers.slice(0, 5).forEach((offer, index) => {
        console.log(`\nOffer ${index + 1}:`);
        console.log(
          `  Flight: ${
            offer.segments?.[0]?.marketingFlight?.carrier?.code || "Unknown"
          } ${offer.segments?.[0]?.marketingFlight?.number || "Unknown"}`
        );
        console.log(
          `  Departure: ${
            offer.segments?.[0]?.departureAirport?.code || "Unknown"
          } at ${offer.segments?.[0]?.departureDateTime || "Unknown"}`
        );
        console.log(
          `  Arrival: ${
            offer.segments?.[0]?.arrivalAirport?.code || "Unknown"
          } at ${offer.segments?.[0]?.arrivalDateTime || "Unknown"}`
        );
        console.log(
          `  Price: ${offer.price?.amount || "Unknown"} ${
            offer.price?.currency || ""
          }`
        );
      });

      if (offers.length > 5) {
        console.log(`\n... and ${offers.length - 5} more offers`);
      }
      return;
    }

    // Second API format
    if (results.data && results.data.lowestFareOffers) {
      const offers = results.data.lowestFareOffers;
      console.log(`Found ${offers.length} date offers:`);

      offers.slice(0, 5).forEach((offer, index) => {
        console.log(`\nDate Option ${index + 1}:`);
        console.log(`  Date: ${offer.date || "Unknown"}`);
        console.log(
          `  Points: ${offer.price?.amount || "Unknown"} ${
            offer.price?.currency || ""
          }`
        );
        console.log(`  Available: ${offer.availabilityStatus || "Unknown"}`);
      });

      if (offers.length > 5) {
        console.log(`\n... and ${offers.length - 5} more date options`);
      }
      return;
    }

    console.log(
      "Could not find results in the expected format. Check the JSON file for details."
    );
  } catch (error) {
    console.error("Error displaying search results:", error.message);
  }
}

/**
 * Generate a random UUID
 * @returns {string} - Random UUID
 */
function generateRandomUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

module.exports = {
  performSearch,
};
