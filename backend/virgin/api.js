const axios = require("axios");
const config = require("./config");
const fs = require("fs");

/**
 * Convert cookies array to header format
 * @param {Array} cookies - Array of cookie objects
 * @returns {String} Cookie header string
 */
function getCookieHeader(cookies) {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

/**
 * Search for award flights
 * @param {Object} params - Search parameters
 * @param {String} params.origin - Origin airport code
 * @param {String} params.destination - Destination airport code
 * @param {String} params.departureDate - Departure date (YYYY-MM-DD)
 * @param {Array} cookies - Browser cookies for authentication
 * @param {Object} [apiContext] - Optional Playwright APIRequestContext
 * @returns {Promise<Object>} - Search results
 */
async function searchAwardFlights(
  { origin, destination, departureDate },
  cookies,
  apiContext = null
) {
  const query = `
    query SearchOffers($request: FlightOfferRequestInput!) {
      searchOffers(request: $request) {
        result {
          slices {
            current
            total
          }
          criteria {
            origin {
              code
              cityName
              countryName
              airportName
            }
            destination {
              code
              cityName
              countryName
              airportName
            }
            departing
          }
          slice {
            id
            fareId
            flightsAndFares {
              flight {
                segments {
                  airline { code name }
                  flightNumber
                  operatingFlightNumber
                  origin { code cityName airportName }
                  destination { code cityName airportName }
                  duration
                  departure
                  arrival
                  bookingClass
                  fareBasisCode
                }
                duration
                origin { code cityName airportName }
                destination { code cityName airportName }
                departure
                arrival
              }
              fares {
                availability
                id
                fareId
                content {
                  cabinName
                  features {
                    type
                    description
                  }
                }
                price {
                  awardPoints
                  tax
                  amountIncludingTax
                  amount
                  currency
                }
              }
            }
          }
          tripSummary {
            currency
            totalAwardPoints
            totalPrice
          }
          basketId
        }
      }
    }
  `;

  const variables = {
    request: {
      pos: null,
      parties: null,
      flightSearchRequest: {
        searchOriginDestinations: [
          {
            origin,
            destination,
            departureDate,
          },
        ],
        bundleOffer: false,
        awardSearch: true,
        calendarSearch: false,
        flexiDateSearch: false,
        nonStopOnly: false,
        currentTripIndexId: "0",
        checkInBaggageAllowance: false,
        carryOnBaggageAllowance: false,
        refundableOnly: false,
      },
      customerDetails: [
        {
          custId: "ADT_0",
          ptc: "ADT",
        },
      ],
    },
  };

  // Convert cookies array to header format
  const cookieHeader = getCookieHeader(cookies);

  const headers = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    origin: "https://www.virginatlantic.com",
    priority: "u=1, i",
    referer: `https://www.virginatlantic.com/flights/search/slice?origin=${origin}&destination=${destination}&departing=${departureDate}&passengers=a1t0c0i0&awardSearch=true`,
    "sec-ch-ua":
      '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    Cookie: cookieHeader,
  };

  const payload = JSON.stringify({ query, variables });

  // Helper to save response to file for debugging
  const saveResponse = (data, prefix = "response") => {
    const filename = `${prefix}_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`💾 Saved response to ${filename}`);
    return data;
  };

  try {
    // APPROACH 1: Use Playwright's request API if available
    if (apiContext) {
      try {
        console.log("🔄 Making API request using Playwright's request API...");

        // Ensure the apiContext has a post method
        if (typeof apiContext.post !== "function") {
          console.warn(
            "⚠️ API context doesn't have a post method, falling back to axios"
          );
          throw new Error("Invalid API context");
        }

        const response = await apiContext.post(config.urls.graphql, {
          headers: headers,
          data: payload,
        });

        if (response.ok()) {
          const data = await response.json();
          console.log("✅ Playwright API request successful");
          return data;
        } else {
          console.warn(
            `⚠️ Playwright API request failed with status ${response.status()}`
          );
          console.warn("Falling back to axios...");

          // For debugging
          try {
            const errorBody = await response.text();
            saveResponse(
              { status: response.status(), body: errorBody },
              "playwright_error"
            );
          } catch (e) {
            console.error("Could not save error response:", e.message);
          }
          throw new Error(`Request failed with status ${response.status()}`);
        }
      } catch (playwrightError) {
        console.warn(
          `⚠️ Error using Playwright API: ${playwrightError.message}`
        );
        console.warn("Falling back to axios...");
      }
    } else {
      console.log(
        "ℹ️ No Playwright API context provided, using axios directly"
      );
    }

    // APPROACH 2: Fallback to axios
    console.log("🔄 Making API request using axios...");
    const res = await axios.post(config.urls.graphql, payload, { headers });

    console.log("✅ Axios API request successful");
    return res.data;
  } catch (error) {
    console.error("Request failed:", error.response?.data || error.message);

    // Save error details for debugging
    if (error.response) {
      saveResponse(
        {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        },
        "axios_error"
      );
    }

    return null;
  }
}

/**
 * Create a Playwright API request context
 * @param {Object} context - Playwright browser context
 * @returns {Promise<Object>} API request context
 */
async function createApiContext(context) {
  if (!context) {
    console.warn("⚠️ No browser context provided, cannot create API context");
    return null;
  }

  try {
    // In newer Playwright versions, the API is available directly from the playwright instance
    // In older versions, we need to use the APIRequestContext directly
    let apiContext;

    if (
      typeof context.request === "object" &&
      typeof context.request.newContext === "function"
    ) {
      // New Playwright API style
      apiContext = await context.request.newContext({
        baseURL: "https://www.virginatlantic.com",
        extraHTTPHeaders: {
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        },
      });
    } else {
      // For older Playwright versions, use the APIRequest class directly
      const { request } = require("playwright");
      apiContext = await request.newContext({
        baseURL: "https://www.virginatlantic.com",
        extraHTTPHeaders: {
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        },
      });
    }

    console.log("✅ Created Playwright API request context");
    return apiContext;
  } catch (error) {
    console.error("❌ Failed to create API context:", error.message);
    return null;
  }
}

module.exports = {
  searchAwardFlights,
  createApiContext,
};
