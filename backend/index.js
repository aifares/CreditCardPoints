const axios = require("axios");
const fs = require("fs");

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

// 🔄 Call the function with user input
searchFlights({
  origin: "NYC",
  destination: "TYO",
  departureDate: "2025-08-08",
  returnDate: "2025-09-04",
  numAdults: 2,
}).then((rows) => {
  const sorted = extractAndSortFlights(rows);
  console.log(JSON.stringify(sorted, null, 2));

  // Optional: write to file
  fs.writeFileSync("sortedFlights.json", JSON.stringify(sorted, null, 2));
});
