const express = require("express");
const cors = require("cors");
const alaskaAirlines = require("./airlines/alaska");
const americanAirlines = require("./airlines/american");
const virginAtlantic = require("./airlines/virgin");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create API endpoint for flight search
app.post("/api/search", async (req, res) => {
  try {
    console.log("Received search request:", req.body);
    const { origin, destination, departureDate, returnDate, numAdults = 1 } = req.body;
    
    // Validate required fields
    if (!origin || !destination || !departureDate) {
      console.log("Missing required fields:", { origin, destination, departureDate });
      return res.status(400).json({ 
        error: "Missing required fields: origin, destination, and departureDate are required" 
      });
    }
    
    // Search parameters
    const searchParams = {
      origin,
      destination,
      departureDate,
      returnDate,
      numAdults
    };
    
    // Search each airline in parallel
    console.log("Searching flights across Alaska, American, and Virgin Atlantic...");
    const airlinePromises = [
      alaskaAirlines.searchFlights(searchParams),
      americanAirlines.searchFlights(searchParams),
      virginAtlantic.searchFlights(searchParams)
    ];

    const results = await Promise.allSettled(airlinePromises);
    
    const [alaskaResults, americanResults, virginResults] = results;

    // Combine results from all airlines
    let allFlights = [];
    
    // Process Alaska results
    if (alaskaResults.status === "fulfilled" && Array.isArray(alaskaResults.value)) {
      console.log(`Found ${alaskaResults.value.length} Alaska Airlines flights`);
      allFlights = [...allFlights, ...alaskaResults.value];
    } else {
      console.error("Error fetching Alaska Airlines flights:", 
        alaskaResults.status === "rejected" ? alaskaResults.reason : "Invalid response format");
    }
    
    // Process American results
    if (americanResults.status === "fulfilled" && Array.isArray(americanResults.value)) {
      console.log(`Found ${americanResults.value.length} American Airlines flights`);
      allFlights = [...allFlights, ...americanResults.value];
    } else {
      console.error("Error fetching American Airlines flights:", 
        americanResults.status === "rejected" ? americanResults.reason : "Invalid response format");
    }

    // Process Virgin Atlantic results
    if (virginResults.status === "fulfilled" && Array.isArray(virginResults.value)) {
      console.log(`Found ${virginResults.value.length} Virgin Atlantic flights`);
      allFlights = [...allFlights, ...virginResults.value];
    } else {
      console.error("Error fetching Virgin Atlantic flights:", 
        virginResults.status === "rejected" ? virginResults.reason : "Invalid response format");
    }
    
    // Sort all flights by miles/points
    allFlights.sort((a, b) => (a.milesPoints || Infinity) - (b.milesPoints || Infinity));
    
    console.log(`Returning ${allFlights.length} total flights, sorted by points.`);
    res.json(allFlights);
  } catch (error) {
    console.error("Error processing flight search:", error);
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