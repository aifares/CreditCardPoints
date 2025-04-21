const axios = require("axios");
const express = require("express");
const cors = require("cors");
const americanApi = require("./american-api");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
    
    console.log("✅ Flights fetched successfully with status:", response.status);
    console.log("Response data structure:", Object.keys(response.data));
    
    if (!response.data || !response.data.rows) {
      console.error("Unexpected API response format:", response.data);
      return [];
    }
    
    return response.data.rows;
  } catch (error) {
    console.error("❌ Failed to fetch flights:", error.message);
    if (error.response) {
      console.error("Error status:", error.response.status);
      console.error("Error data:", error.response.data);
    } else if (error.request) {
      console.error("No response received from Alaska Air API");
    } else {
      console.error("Error setting up the request:", error.message);
    }
  
  }
}

function extractAndSortFlights(rows) {
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
        : ["Unknown Airline"];

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
        });
      });
    } catch (error) {
      console.error(`Error processing flight row ${row?.id || 'unknown'}:`, error);
      console.error('Problem row:', JSON.stringify(row, null, 2));
    }
  });

  // Sort by miles and handle case with no fares
  if (allFares.length === 0) {
    console.warn("No valid fares found to sort");
    return [];
  }
  
  return allFares.sort((a, b) => a.milesPoints - b.milesPoints);
}

// Create API endpoint for Alaska Air flight search
app.post("/api/search/alaska", async (req, res) => {
  try {
    console.log("Received Alaska Airlines search request:", req.body);
    const { origin, destination, departureDate, returnDate, numAdults = 1 } = req.body;
    
    // Validate required fields
    if (!origin || !destination || !departureDate || !returnDate) {
      console.log("Missing required fields:", { origin, destination, departureDate, returnDate });
      return res.status(400).json({ 
        error: "Missing required fields: origin, destination, departureDate, and returnDate are required" 
      });
    }
    
    console.log("Searching Alaska Airlines flights with parameters:", { origin, destination, departureDate, returnDate, numAdults });
    const rows = await searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      numAdults,
    });
    
    console.log(`Found ${rows?.length || 0} rows of flight data`);
    
    if (!rows || !Array.isArray(rows)) {
      console.error("Invalid response format from Alaska Air API:", rows);
      return res.status(500).json({ error: "Unexpected response format from airline API" });
    }
    
    const sortedFlights = extractAndSortFlights(rows);
    console.log(`Returning ${sortedFlights.length} sorted flights`);
    res.json(sortedFlights);
  } catch (error) {
    console.error("Error processing Alaska Airlines flight search:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Failed to process flight search" });
  }
});

// Create API endpoint for American Airlines flight search
app.post("/api/search/american", async (req, res) => {
  try {
    console.log("Received American Airlines search request:", req.body);
    const { origin, destination, departureDate, returnDate, numAdults = 1 } = req.body;
    
    // Validate required fields
    if (!origin || !destination || !departureDate || !returnDate) {
      console.log("Missing required fields:", { origin, destination, departureDate, returnDate });
      return res.status(400).json({ 
        error: "Missing required fields: origin, destination, departureDate, and returnDate are required" 
      });
    }
    
    console.log("Searching American Airlines flights with parameters:", { origin, destination, departureDate, returnDate, numAdults });
    const apiResponse = await americanApi.searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      numAdults,
    });
    
    const sortedFlights = americanApi.formatResults(apiResponse);
    console.log(`Returning ${sortedFlights.length} sorted American Airlines flights`);
    res.json(sortedFlights);
  } catch (error) {
    console.error("Error processing American Airlines flight search:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Failed to process American Airlines flight search" });
  }
});

// Create API endpoint that searches both airlines and combines results
app.post("/api/search", async (req, res) => {
  try {
    console.log("Received combined search request:", req.body);
    const { origin, destination, departureDate, returnDate, numAdults = 1 } = req.body;
    
    // Validate required fields
    if (!origin || !destination || !departureDate || !returnDate) {
      console.log("Missing required fields:", { origin, destination, departureDate, returnDate });
      return res.status(400).json({ 
        error: "Missing required fields: origin, destination, departureDate, and returnDate are required" 
      });
    }
    
    console.log("Searching flights on multiple airlines:", { origin, destination, departureDate, returnDate, numAdults });
    
    // Search flights from both airlines in parallel
    const [alaskaRows, americanResponse] = await Promise.allSettled([
      searchFlights({
        origin,
        destination,
        departureDate,
        returnDate,
        numAdults,
      }),
      americanApi.searchFlights({
        origin,
        destination,
        departureDate,
        returnDate,
        numAdults,
      })
    ]);
    
    // Process Alaska Airlines results
    let alaskaFlights = [];
    if (alaskaRows.status === 'fulfilled' && Array.isArray(alaskaRows.value)) {
      alaskaFlights = extractAndSortFlights(alaskaRows.value);
      console.log(`Found ${alaskaFlights.length} Alaska Airlines flights`);
    } else {
      console.log('Alaska Airlines search failed or returned no results');
    }
    
    // Process American Airlines results
    let americanFlights = [];
    if (americanResponse.status === 'fulfilled') {
      americanFlights = americanApi.formatResults(americanResponse.value);
      console.log(`Found ${americanFlights.length} American Airlines flights`);
    } else {
      console.log('American Airlines search failed or returned no results');
    }
    
    // Combine and sort all flights by miles
    const allFlights = [...alaskaFlights, ...americanFlights]
      .sort((a, b) => a.milesPoints - b.milesPoints);
    
    console.log(`Returning ${allFlights.length} combined flights from all airlines`);
    res.json(allFlights);
  } catch (error) {
    console.error("Error processing combined flight search:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Failed to process flight search" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  - Alaska Airlines: http://localhost:${PORT}/api/search/alaska`);
  console.log(`  - American Airlines: http://localhost:${PORT}/api/search/american`);
  console.log(`  - Combined search: http://localhost:${PORT}/api/search`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    const newPort = PORT + 1;
    app.listen(newPort, () => {
      console.log(`Server running on port ${newPort}`);
      console.log(`API endpoints:`);
      console.log(`  - Alaska Airlines: http://localhost:${newPort}/api/search/alaska`);
      console.log(`  - American Airlines: http://localhost:${newPort}/api/search/american`);
      console.log(`  - Combined search: http://localhost:${newPort}/api/search`);
    });
  } else {
    console.error('Server error:', err);
  }
});
