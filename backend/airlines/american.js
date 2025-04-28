const axios = require("axios");

/**
 * Search for flights on American Airlines
 */
async function searchFlights({
  origin,
  destination,
  departureDate,
  returnDate,
  numAdults,
}) {
  try {
    console.log("Sending request to American Airlines API");
    
    // Mock payload structure - In a real implementation, this would be the actual AA API payload
    const payload = {
      slices: [
        {
          origin: origin,
          destination: destination,
          departureDate: departureDate
        },
        {
          origin: destination,
          destination: origin,
          departureDate: returnDate
        }
      ],
      passengers: {
        adults: numAdults
      },
      cabinClass: "economy",
      searchType: "miles"
    };
    
    console.log("AA Payload:", JSON.stringify(payload, null, 2));
    
    // This is a mock response for demonstration purposes
    // In a real implementation, this would be an actual API call to American Airlines
    
    // Mock API call simulation with timeout
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock API response with simulated data
    const mockResponse = {
      status: 200,
      data: generateMockAmericanAirlinesFlights(origin, destination, departureDate, returnDate)
    };
    
    console.log("✅ American Airlines flights fetched successfully with status:", mockResponse.status);
    
    // Process the mock results
    return formatAmericanAirlinesFlights(mockResponse.data);
  } catch (error) {
    console.error("❌ Failed to fetch American Airlines flights:", error.message);
    return [];
  }
}

/**
 * Generate mock American Airlines flight data for development and testing
 */
function generateMockAmericanAirlinesFlights(origin, destination, departureDate, returnDate) {
  // Generate random number of flights between 3-8
  const numFlights = 3 + Math.floor(Math.random() * 6);
  const flights = [];
  
  // Base departure date object
  const depDate = new Date(departureDate);
  
  // Generate mock flights
  for (let i = 0; i < numFlights; i++) {
    // Create random departure time (7AM to 9PM)
    const depHour = 7 + Math.floor(Math.random() * 14);
    const depMin = Math.floor(Math.random() * 60);
    const departureDateTime = new Date(depDate);
    departureDateTime.setHours(depHour, depMin);
    
    // Random duration between 2-8 hours
    const durationMinutes = 120 + Math.floor(Math.random() * 360);
    
    // Calculate arrival time
    const arrivalDateTime = new Date(departureDateTime.getTime() + durationMinutes * 60000);
    
    // Generate miles required (10,000 to 60,000)
    const miles = 10000 + Math.floor(Math.random() * 50000);
    
    // Generate random class type
    const classTypes = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];
    const classType = classTypes[Math.floor(Math.random() * classTypes.length)];
    
    // Generate random available seats (1-9)
    const seats = 1 + Math.floor(Math.random() * 9);
    
    flights.push({
      id: `AA-${100 + i}`,
      origin: origin,
      destination: destination,
      departureTime: departureDateTime.toISOString(),
      arrivalTime: arrivalDateTime.toISOString(),
      duration: durationMinutes,
      classType: classType,
      miles: miles,
      availableSeats: seats,
      refundable: Math.random() > 0.5
    });
  }
  
  return flights;
}

/**
 * Process and format American Airlines flight data to match the common format
 */
function formatAmericanAirlinesFlights(flights) {
  return flights.map(flight => ({
    id: flight.id,
    airline: "American Airlines",
    route: `${flight.origin} → ${flight.destination}`,
    classType: flight.classType,
    milesPoints: flight.miles,
    seatsRemaining: flight.availableSeats,
    cabinTypes: [flight.classType.replace("_", " ")],
    refundable: flight.refundable,
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    duration: flight.duration,
    airlines: ["American Airlines"]
  }));
}

module.exports = {
  searchFlights
}; 