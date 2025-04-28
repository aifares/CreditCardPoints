const axios = require("axios");

/**
 * Search for flights on Alaska Airlines
 */
async function searchFlights({
  origin,
  destination,
  departureDate,
  returnDate,
  numAdults,
}) {
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
    console.log("Sending request to Alaska Air API");
    console.log("Payload:", JSON.stringify(payload, null, 2));
    
    const response = await axios.post(
      "https://www.alaskaair.com/search/api/flightresults",
      JSON.stringify(payload),
      { 
        headers,
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log("✅ Alaska Airlines flights fetched successfully with status:", response.status);
    
    if (!response.data || !response.data.rows) {
      console.error("Unexpected API response format from Alaska Airlines:", response.data);
      return [];
    }
    
    // Process the results
    return extractAndFormatFlights(response.data.rows);
  } catch (error) {
    console.error("❌ Failed to fetch Alaska Airlines flights:", error.message);
    if (error.response) {
      console.error("Error status:", error.response.status);
      console.error("Error data:", error.response.data);
    } else if (error.request) {
      console.error("No response received from Alaska Air API");
    } else {
      console.error("Error setting up the request:", error.message);
    }
    return [];
  }
}

/**
 * Process and format Alaska Airlines flight data
 */
function extractAndFormatFlights(rows) {
  const allFares = [];

  rows.forEach((row) => {
    try {
      // Handle case where segments might be undefined or not an array
      if (!row.segments || !Array.isArray(row.segments) || row.segments.length === 0) {
        console.warn(`Flight row ${row.id} has invalid segments:`, row.segments);
        return; // Skip this row
      }

      const segments = row.segments;
      const first = segments[0];
      const last = segments[segments.length - 1];
      
      // Check if required properties exist
      if (!first || !last || !first.departureTime || !last.departureTime) {
        console.warn(`Flight row ${row.id} has invalid segment data`);
        return; // Skip this row
      }
      
      // Extract airlines with fallback for missing data
      const airlines = Array.isArray(segments) 
        ? [...new Set(segments
            .filter(s => s && s.displayCarrier && s.displayCarrier.carrierFullName)
            .map(s => s.displayCarrier.carrierFullName)
          )]
        : ["Alaska Airlines"];

      // Make sure solutions exists and is an object
      if (!row.solutions || typeof row.solutions !== 'object') {
        console.warn(`Flight row ${row.id} has no solutions`);
        return; // Skip this row
      }

      Object.entries(row.solutions || {}).forEach(([classType, fare]) => {
        if (!fare) {
          console.warn(`Flight row ${row.id} has invalid fare for ${classType}`);
          return; // Skip this fare
        }
        
        allFares.push({
          id: row.id,
          airline: "Alaska Airlines",
          route: `${row.origin} → ${row.destination}`,
          classType,
          milesPoints: fare.milesPoints || 0,
          seatsRemaining: fare.seatsRemaining || 0,
          cabinTypes: Array.isArray(fare.cabins) ? fare.cabins : ["Unknown"],
          refundable: Boolean(fare.refundable),
          departureTime: first.departureTime,
          arrivalTime: last.arrivalTime || last.departureTime,
          duration: row.duration || 0,
          airlines: airlines.length > 0 ? airlines : ["Alaska Airlines"],
        });
      });
    } catch (error) {
      console.error(`Error processing Alaska Airlines flight row ${row?.id || 'unknown'}:`, error);
    }
  });

  if (allFares.length === 0) {
    console.warn("No valid Alaska Airlines fares found");
    return [];
  }
  
  return allFares;
}

module.exports = {
  searchFlights
}; 