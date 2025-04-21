const axios = require("axios");
const express = require("express");
const cors = require("cors");

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
    "user-agent": "Mozilla/5.0",
  };

  try {
    const response = await axios.post(
      "https://www.alaskaair.com/search/api/flightresults",
      JSON.stringify(payload),
      { headers }
    );
    console.log("✅ Flights fetched successfully");
    return response.data.rows;
  } catch (error) {
    console.error("❌ Failed to fetch flights:", error.message);
    return [];
  }
}

function extractAndSortFlights(rows) {
  const allFares = [];

  rows.forEach((row) => {
    const segments = row.segments;
    const first = segments[0];
    const last = segments[segments.length - 1];
    const airlines = [
      ...new Set(segments.map((s) => s.displayCarrier.carrierFullName)),
    ];

    Object.entries(row.solutions || {}).forEach(([classType, fare]) => {
      allFares.push({
        id: row.id,
        route: `${row.origin} → ${row.destination}`,
        classType,
        milesPoints: fare.milesPoints,
        seatsRemaining: fare.seatsRemaining,
        cabinTypes: fare.cabins,
        refundable: fare.refundable,
        departureTime: first.departureTime,
        arrivalTime: last.arrivalTime,
        duration: row.duration,
        airlines,
      });
    });
  });

  // Sort by miles
  return allFares.sort((a, b) => a.milesPoints - b.milesPoints);
}

// Create API endpoint for flight search
app.post("/api/search", async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, numAdults = 1 } = req.body;
    
    // Validate required fields
    if (!origin || !destination || !departureDate || !returnDate) {
      return res.status(400).json({ 
        error: "Missing required fields: origin, destination, departureDate, and returnDate are required" 
      });
    }
    
    const rows = await searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      numAdults,
    });
    
    const sortedFlights = extractAndSortFlights(rows);
    res.json(sortedFlights);
  } catch (error) {
    console.error("Error processing flight search:", error.message);
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
  console.log(`API endpoint: http://localhost:${PORT}/api/search`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    const newPort = PORT + 1;
    app.listen(newPort, () => {
      console.log(`Server running on port ${newPort}`);
      console.log(`API endpoint: http://localhost:${newPort}/api/search`);
    });
  } else {
    console.error('Server error:', err);
  }
});
