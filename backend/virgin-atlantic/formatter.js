/**
 * Format Virgin Atlantic API response into standardized Meelo format
 * @param {Object} apiData Virgin Atlantic API response
 * @returns {Array} Formatted flight data
 */
function formatFlightResults(apiData) {
  const results = [];
  let idCounter = 0;

  const offers =
    apiData?.data?.searchOffers?.result?.slice?.flightsAndFares || [];

  offers.forEach(({ flight, fares }) => {
    const segment = flight.segments[0];
    const origin = segment.origin.code;
    const destination = segment.destination.code;
    const departureTime = segment.departure;
    const arrivalTime = segment.arrival;
    const duration = segment.duration;
    const airline = segment.airline.name;
    const flightNumber = segment.flightNumber;

    (fares || []).forEach((fare) => {
      const price = fare.price;
      if (!price || !price.awardPoints) return;

      const classType = determineClassType(fare.fareId || "");

      results.push({
        id: idCounter++,
        route: `${origin} → ${destination}`,
        flightNumber,
        airline,
        departureTime,
        arrivalTime,
        duration,
        classType,
        soldOut: fare.availability === "SOLD_OUT",
        milesPoints: parseInt(price.awardPoints, 10),
        taxAmount: price.tax ?? 0,
        taxCurrency: price.currency ?? "USD",
      });
    });
  });

  return results.sort((a, b) => a.milesPoints - b.milesPoints);
}

/**
 * Determine the class type based on the fare ID
 * @param {string} fareId The fare ID from the API
 * @returns {string} The class type
 */
function determineClassType(fareId) {
  if (fareId.startsWith("X") || fareId.startsWith("K")) return "Economy";
  if (fareId.startsWith("N") || fareId.startsWith("Y"))
    return "Premium Economy";
  if (fareId.startsWith("B") || fareId.startsWith("S")) return "Business";
  if (fareId.startsWith("C") || fareId.startsWith("W")) return "Upper Class";
  return "Unknown";
}

module.exports = { formatFlightResults };
