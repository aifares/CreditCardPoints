const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * Fetch Alaska Airlines flight data
 * @param {Object} options - Options for the search
 * @param {string} options.origin - Origin airport code
 * @param {string} options.destination - Destination airport code
 * @param {string} options.departureDate - Departure date in YYYY-MM-DD format
 * @param {string} options.returnDate - Return date in YYYY-MM-DD format
 * @param {number} options.numAdults - Number of adult passengers
 * @returns {Promise<Array>} - Formatted flight results
 */
async function fetchAlaskaFlights(options = {}) {
  try {
    console.log("[ALASKA] fetchAlaskaFlights called with options:", JSON.stringify(options, null, 2));
    
    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate = departureDate, // Default to one-way if no return date
      numAdults = 1 
    } = options;
    
    // Validate required fields
    if (!origin || !destination || !departureDate) {
      console.log("[ALASKA] Missing required fields:", { origin, destination, departureDate });
      return [];
    }

    console.log(`[ALASKA] Using origin: ${origin}, destination: ${destination}, departureDate: ${departureDate}, returnDate: ${returnDate}, numAdults: ${numAdults}`);

    const payload = {
      origins: [origin, destination],
      destinations: [destination, origin],
      dates: [departureDate, returnDate],
      numADTs: numAdults,
      numINFs: 0,
      numCHDs: 0,
      fareView: "as_awards",
      onba: false,
      dnba: false,
      discount: {
        code: "",
        status: 0,
        expirationDate: new Date().toISOString(),
        message: "",
        memo: "",
        type: 0,
        searchContainsDiscountedFare: false,
        campaignName: "",
        campaignCode: "",
        distribution: 0,
        amount: 0,
        validationErrors: [],
        maxPassengers: 0,
      },
      isAlaska: false,
      isMobileApp: false,
      sliceId: 0,
      businessRequest: {
        TravelerId: "",
        BusinessRequestType: 0,
        CountryCode: "",
        StateCode: "",
        ShowOnlySpecialFares: false,
      },
      umnrAgeGroup: "",
      lockFare: false,
      sessionID: "",
      solutionIDs: [],
      solutionSetIDs: [],
      qpxcVersion: "",
      trackingTags: [],
    };

    const headers = {
      accept: "*/*",
      "content-type": "text/plain;charset=UTF-8",
      origin: "https://www.alaskaair.com",
      referer: "https://www.alaskaair.com/search/results",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    };

    try {
      console.log("[ALASKA] Sending request to Alaska Air API");
      console.log("[ALASKA] Payload:", JSON.stringify(payload, null, 2));
      
      const response = await axios.post(
        "https://www.alaskaair.com/search/api/flightresults",
        JSON.stringify(payload),
        { 
          headers,
          timeout: 30000 // 30 second timeout
        }
      );
      
      console.log("[ALASKA] Flights fetched successfully with status:", response.status);
      console.log("[ALASKA] Response data structure:", Object.keys(response.data));
      
      if (!response.data || !response.data.rows) {
        console.error("[ALASKA] Unexpected API response format:", response.data);
        return [];
      }
      
      // Save the raw API response for debugging
      const outputPath = path.join(__dirname, '..', 'alaska-raw.json');
      try {
        fs.writeFileSync(
          outputPath,
          JSON.stringify(response.data, null, 2)
        );
        console.log("[ALASKA] API Response saved to alaska-raw.json");
      } catch (writeError) {
        console.error("[ALASKA] Error saving raw API response:", writeError.message);
      }
      
      try {
        const formattedResults = extractAndSortFlights(response.data.rows);
        console.log(`[ALASKA] Formatted ${formattedResults.length} results`);
        
        // Save formatted results
        const resultsPath = path.join(__dirname, '..', 'alaska.json');
        fs.writeFileSync(
          resultsPath,
          JSON.stringify(formattedResults, null, 2)
        );
        console.log("[ALASKA] Formatted results saved to alaska.json");
        
        return formattedResults;
      } catch (formatError) {
        console.error("[ALASKA] Error formatting results:", formatError.message);
        console.error("[ALASKA] Format error stack:", formatError.stack);
        return [];
      }
    } catch (requestError) {
      console.error("[ALASKA] Failed to fetch flights:", requestError.message);
      if (requestError.response) {
        console.error("[ALASKA] Error status:", requestError.response.status);
        console.error("[ALASKA] Error data:", typeof requestError.response.data === 'object' 
          ? JSON.stringify(requestError.response.data, null, 2) 
          : requestError.response.data);
      } else if (requestError.request) {
        console.error("[ALASKA] No response received from Alaska Air API");
        console.error("[ALASKA] Request details:", requestError.request._header || 'No request details available');
      } else {
        console.error("[ALASKA] Error setting up the request:", requestError.message);
      }
      console.error("[ALASKA] Request error stack:", requestError.stack);
      
      // Try to load cached results if API call fails
      console.log("[ALASKA] Trying to load cached Alaska results from file");
      const cachedPath = path.join(__dirname, '..', 'alaska.json');
      
      if (fs.existsSync(cachedPath)) {
        try {
          const cachedResults = JSON.parse(fs.readFileSync(cachedPath, 'utf8'));
          console.log(`[ALASKA] Found ${cachedResults.length} cached Alaska flights`);
          return cachedResults;
        } catch (cacheError) {
          console.error("[ALASKA] Error reading cached Alaska results:", cacheError.message);
        }
      } else {
        console.log("[ALASKA] No cached Alaska results found");
      }
      
      return [];
    }
  } catch (error) {
    console.error("[ALASKA] General error in fetchAlaskaFlights:", error.message);
    console.error("[ALASKA] Error stack:", error.stack);
    return [];
  }
}

/**
 * Extract and sort flights from Alaska Airlines API response
 * @param {Array} rows - Flight rows from Alaska Airlines API
 * @returns {Array} - Sorted flight results
 */
function extractAndSortFlights(rows) {
  console.log(`[ALASKA] extractAndSortFlights called with ${rows.length} rows`);
  
  try {
    const allFares = [];

    rows.forEach((row, rowIndex) => {
      try {
        // Handle case where segments might be undefined or not an array
        if (!row.segments || !Array.isArray(row.segments) || row.segments.length === 0) {
          console.warn(`[ALASKA] Flight row ${row.id || rowIndex} has invalid segments:`, row.segments);
          return; // Skip this row
        }

        const segments = row.segments;
        const first = segments[0];
        const last = segments[segments.length - 1];
        
        // Check if required properties exist
        if (!first || !last || !first.departureTime || !last.departureTime) {
          console.warn(`[ALASKA] Flight row ${row.id || rowIndex} has invalid segment data`);
          return; // Skip this row
        }
        
        // Extract airlines with fallback for missing data
        const airlines = Array.isArray(segments) 
          ? [...new Set(segments
              .filter(s => s && s.displayCarrier && s.displayCarrier.carrierFullName)
              .map(s => s.displayCarrier.carrierFullName)
            )]
          : ["Unknown Airline"];

        // Make sure solutions exists and is an object
        if (!row.solutions || typeof row.solutions !== 'object') {
          console.warn(`[ALASKA] Flight row ${row.id || rowIndex} has no solutions`);
          return; // Skip this row
        }

        const solutionEntries = Object.entries(row.solutions || {});
        console.log(`[ALASKA] Processing ${solutionEntries.length} solutions for row ${row.id || rowIndex}`);

        solutionEntries.forEach(([classType, fare], fareIndex) => {
          try {
            if (!fare) {
              console.warn(`[ALASKA] Flight row ${row.id || rowIndex} has invalid fare for ${classType}`);
              return; // Skip this fare
            }
            
            allFares.push({
              id: row.id || `alaska-${rowIndex}-${fareIndex}`,
              route: `${row.origin} → ${row.destination}`,
              classType,
              milesPoints: fare.milesPoints || 0,
              seatsRemaining: fare.seatsRemaining || 0,
              cabinTypes: Array.isArray(fare.cabins) ? fare.cabins : ["Unknown"],
              refundable: Boolean(fare.refundable),
              departureTime: first.departureTime,
              arrivalTime: last.arrivalTime || last.departureTime,
              duration: row.duration || 0,
              airlines: airlines.length > 0 ? airlines : ["Unknown Airline"],
              airlineCode: "AS" // Alaska Airlines code
            });
          } catch (fareError) {
            console.error(`[ALASKA] Error processing fare ${fareIndex} for row ${row.id || rowIndex}:`, fareError.message);
          }
        });
      } catch (rowError) {
        console.error(`[ALASKA] Error processing row ${rowIndex}:`, rowError.message);
      }
    });

    // Sort by miles and handle case with no fares
    if (allFares.length === 0) {
      console.warn("[ALASKA] No valid fares found to sort");
      return [];
    }
    
    console.log(`[ALASKA] Extracted ${allFares.length} total fares`);
    return allFares.sort((a, b) => a.milesPoints - b.milesPoints);
  } catch (extractError) {
    console.error("[ALASKA] General error in extractAndSortFlights:", extractError.message);
    console.error("[ALASKA] Extract error stack:", extractError.stack);
    return [];
  }
}

// Run directly when called from command line
if (require.main === module) {
  const testSearch = {
    origin: "SEA",
    destination: "LAX",
    departureDate: "2023-06-15",
    returnDate: "2023-06-22",
    numAdults: 1
  };
  
  fetchAlaskaFlights(testSearch)
    .then(results => {
      console.log(`Found ${results.length} Alaska Airlines flights`);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

module.exports = {
  fetchAlaskaFlights,
  extractAndSortFlights
};