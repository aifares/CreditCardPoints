const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * Search for flights on Virgin Atlantic
 */
async function searchFlights({
  origin,
  destination,
  departureDate,
  returnDate, // Note: Virgin API might handle one-way differently, this is simplified
  numAdults,
}) {
  try {
    console.log("Attempting to search Virgin Atlantic flights...");

    // Define the path to the cookies file relative to this script
    const cookiesPath = path.join(__dirname, "../virgin/cookies.json");
    let cookies = [];

    // Try to read cookies from the file
    if (fs.existsSync(cookiesPath)) {
      try {
        const cookiesData = fs.readFileSync(cookiesPath, 'utf8');
        cookies = JSON.parse(cookiesData);
        console.log(`✅ Read ${cookies.length} cookies from ${cookiesPath}`);
      } catch (err) {
        console.warn(`⚠️ Could not read or parse cookies from ${cookiesPath}:`, err.message);
        cookies = []; // Reset cookies if reading fails
      }
    } else {
      console.log(`ℹ️ Cookies file not found at ${cookiesPath}.`);
    }

    // GraphQL query structure (simplified from original files)
    const query = `
      query SearchOffers($request: FlightOfferRequestInput!) {
        searchOffers(request: $request) {
          result {
            slice {
              flightsAndFares {
                flight {
                  segments {
                    airline { code name }
                    flightNumber
                    origin { code cityName airportName }
                    destination { code cityName airportName }
                    duration
                    departure
                    arrival
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
                  content { cabinName }
                  price { awardPoints tax currency }
                }
              }
            }
          }
        }
      }
    `;

    const variables = {
      request: {
        flightSearchRequest: {
          searchOriginDestinations: [
            {
              origin,
              destination,
              departureDate,
            },
            // Include return leg if date is provided
            ...(returnDate ? [{
              origin: destination,
              destination: origin,
              departureDate: returnDate,
            }] : []),
          ],
          bundleOffer: false,
          awardSearch: true,
          calendarSearch: false,
          nonStopOnly: false,
        },
        // Assuming 1 adult for simplicity based on query structure
        customerDetails: Array(numAdults).fill(0).map((_, i) => ({
          custId: `ADT_${i}`,
          ptc: "ADT",
        })),
      },
    };

    // If we don't have enough cookies, generate mock data
    if (cookies.length < 5) { // Arbitrary check, real API might need specific cookies
      console.log("Insufficient cookies found. Generating mock Virgin Atlantic data.");
      return generateMockVirginFlights(origin, destination, departureDate, returnDate);
    }

    // Prepare request for actual API call
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    const headers = {
      "content-type": "application/json",
      "accept": "*/*",
      "origin": "https://www.virginatlantic.com",
      "referer": `https://www.virginatlantic.com/flights/search/results?origin=${origin}&destination=${destination}&departing=${departureDate}&awardSearch=true`, // Example referer
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "Cookie": cookieHeader,
    };
    const payload = JSON.stringify({ query, variables });
    const apiUrl = "https://www.virginatlantic.com/api/graphql"; // GraphQL endpoint

    console.log(`Sending actual request to Virgin Atlantic API: ${apiUrl}`);
    // --- ACTUAL API CALL --- (commented out, use mock data for now)
    /*
    try {
      const response = await axios.post(apiUrl, payload, { headers, timeout: 20000 });
      console.log("✅ Virgin Atlantic API request successful");
      // Need to parse response.data.data.searchOffers.result correctly
      return formatVirginFlights(response.data?.data?.searchOffers?.result);
    } catch (apiError) {
      console.error("❌ Virgin Atlantic API call failed:", apiError.response?.data || apiError.message);
      console.log("Falling back to mock Virgin Atlantic data due to API error.");
      return generateMockVirginFlights(origin, destination, departureDate, returnDate);
    }
    */
    // --- MOCK DATA RETURN (Remove when uncommenting API call) ---
    console.log("ℹ️ Using mock data for Virgin Atlantic (API call is commented out).");
    return generateMockVirginFlights(origin, destination, departureDate, returnDate);
    // --- END MOCK DATA RETURN ---

  } catch (error) {
    console.error("❌ Error in searchFlights for Virgin Atlantic:", error.message);
    console.log("Falling back to mock Virgin Atlantic data due to general error.");
    return generateMockVirginFlights(origin, destination, departureDate, returnDate); // Fallback to mock data
  }
}

/**
 * Generate mock Virgin Atlantic flight data
 */
function generateMockVirginFlights(origin, destination, departureDate, returnDate) {
  const numFlights = 2 + Math.floor(Math.random() * 4); // 2 to 5 mock flights
  const flights = [];
  const depDate = new Date(departureDate);

  for (let i = 0; i < numFlights; i++) {
    const depHour = 8 + Math.floor(Math.random() * 14); // 8 AM to 9 PM
    const depMin = Math.floor(Math.random() * 60);
    const departureDateTime = new Date(depDate);
    departureDateTime.setHours(depHour, depMin);

    const durationMinutes = 180 + Math.floor(Math.random() * 480); // 3 to 11 hours
    const arrivalDateTime = new Date(departureDateTime.getTime() + durationMinutes * 60000);
    const miles = 15000 + Math.floor(Math.random() * 70000);
    const classTypes = ["ECONOMY", "PREMIUM", "UPPER CLASS"];
    const classType = classTypes[Math.floor(Math.random() * classTypes.length)];
    const seats = 1 + Math.floor(Math.random() * 8);

    // Mock structure similar to API response structure for formatVirginFlights
    flights.push({
        // Mocking the nested structure the formatter expects
        flight: {
            segments: [{ 
                airline: { name: Math.random() > 0.6 ? "Delta Air Lines" : "Virgin Atlantic" },
                departure: departureDateTime.toISOString(),
                arrival: arrivalDateTime.toISOString(),
                origin: { code: origin },
                destination: { code: destination }
            }],
            duration: durationMinutes,
        },
        fares: [{
            id: `mock-vs-${Date.now()}-${i}`,
            content: { cabinName: classType },
            price: { awardPoints: miles },
            availability: seats // Assuming availability means seats
        }]
    });
  }

  // We need to wrap the flights in the expected structure for the formatter
  const mockApiResult = {
    slice: [{ flightsAndFares: flights }]
  };

  return formatVirginFlights(mockApiResult);
}

/**
 * Process and format Virgin Atlantic flight data from API response or mock data
 */
function formatVirginFlights(result) {
  const formattedFlights = [];
  // Check if result and result.slice exist and are arrays
  if (!result || !Array.isArray(result.slice)) {
    console.warn("Invalid format for Virgin Atlantic result.slice:", result);
    return [];
  }

  // Iterate through each slice (outbound/inbound)
  result.slice.forEach(slice => {
    if (!slice || !Array.isArray(slice.flightsAndFares)) return;

    // Iterate through flight/fare combinations in the slice
    slice.flightsAndFares.forEach(ff => {
      if (!ff || !ff.flight || !Array.isArray(ff.fares) || ff.fares.length === 0) return;

      const flight = ff.flight;
      const firstSegment = flight.segments?.[0];
      const lastSegment = flight.segments?.[flight.segments.length - 1];

      if (!firstSegment || !lastSegment) return; // Need segment info

      // Process each fare available for this specific flight itinerary
      ff.fares.forEach(fare => {
        if (!fare || !fare.price || fare.price.awardPoints === undefined) return;

        formattedFlights.push({
          id: fare.id || `vs-${Date.now()}-${Math.random()}`,
          airline: "Virgin Atlantic", // Main carrier
          route: `${firstSegment.origin.code} → ${lastSegment.destination.code}`,
          classType: fare.content?.cabinName || "Unknown",
          milesPoints: fare.price.awardPoints || 0,
          seatsRemaining: fare.availability || 0, // Using availability as seats remaining
          cabinTypes: [fare.content?.cabinName || "Unknown"],
          refundable: false, // API doesn't seem to provide this easily, default to false
          departureTime: firstSegment.departure,
          arrivalTime: lastSegment.arrival,
          duration: flight.duration || 0,
          // List all operating airlines in the segments
          airlines: [...new Set(flight.segments.map(s => s.airline?.name).filter(Boolean))] 
        });
      });
    });
  });

  if (formattedFlights.length === 0) {
    console.warn("No valid Virgin Atlantic fares found after formatting.");
  }

  return formattedFlights;
}

module.exports = {
  searchFlights
}; 