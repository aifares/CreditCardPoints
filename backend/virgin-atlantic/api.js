const axios = require("axios");
const config = require("./config");

/**
 * Search for award flights on Virgin Atlantic
 * @param {Object} options Search parameters
 * @param {string} options.origin Origin airport code
 * @param {string} options.destination Destination airport code
 * @param {string} options.departureDate Departure date in YYYY-MM-DD format
 * @param {string} cookieHeader Cookie header string for authentication
 * @returns {Promise<Object>} Flight search results
 */
async function searchAwardFlights(
  { origin, destination, departureDate },
  cookieHeader
) {
  const data = JSON.stringify({
    query: `query SearchOffers($request: FlightOfferRequestInput!) {
      searchOffers(request: $request) {
        result {
          slices {
            current
            total
            __typename
          }
          criteria {
            origin {
              code
              cityName
              countryName
              airportName
              __typename
            }
            destination {
              code
              cityName
              countryName
              airportName
              __typename
            }
            departing
            __typename
          }
          slice {
            id
            fareId
            flightsAndFares {
              flight {
                segments {
                  metal {
                    family
                    name
                    __typename
                  }
                  airline {
                    code
                    name
                    __typename
                  }
                  flightNumber
                  operatingFlightNumber
                  pendingGovtApproval
                  operatingAirline {
                    code
                    name
                    __typename
                  }
                  origin {
                    code
                    cityName
                    countryName
                    airportName
                    __typename
                  }
                  destination {
                    code
                    cityName
                    countryName
                    airportName
                    __typename
                  }
                  duration
                  departure
                  arrival
                  stopCount
                  connection
                  legs {
                    duration
                    departure
                    arrival
                    stopOver
                    isDominantLeg
                    destination {
                      code
                      cityName
                      countryName
                      airportName
                      __typename
                    }
                    origin {
                      code
                      cityName
                      countryName
                      airportName
                      __typename
                    }
                    __typename
                  }
                  bookingClass
                  fareBasisCode
                  dominantFareProduct
                  __typename
                }
                duration
                origin {
                  code
                  cityName
                  countryName
                  airportName
                  __typename
                }
                destination {
                  code
                  cityName
                  countryName
                  airportName
                  __typename
                }
                departure
                arrival
                __typename
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
                    __typename
                  }
                  __typename
                }
                price {
                  awardPoints
                  awardPointsDifference
                  awardPointsDifferenceSign
                  tax
                  amountIncludingTax
                  priceDifference
                  priceDifferenceSign
                  amount
                  currency
                  __typename
                }
                fareSegments {
                  cabinName
                  bookingClass
                  isDominantLeg
                  isSaverFare
                  __typename
                }
                available
                fareFamilyType
                cabinSelected
                isSaverFare
                promoCodeApplied
                __typename
              }
              __typename
            }
            __typename
          }
          tripSummary {
            sliceDetails {
              sliceNumber
              selectedCabin
              selectedPrice
              __typename
            }
            currency
            totalAwardPoints
            totalPrice
            __typename
          }
          basketId
          __typename
        }
        calendar {
          fromPrices {
            fromDate
            price {
              amount
              awardPoints
              currency
              minimumPriceInWeek
              minimumPriceInMonth
              remaining
              direct
              __typename
            }
            __typename
          }
          from
          to
          __typename
        }
        priceGrid {
          criteria {
            destination {
              cityName
              __typename
            }
            __typename
          }
          returning
          departures {
            departing
            prices {
              price {
                amount
                currency
                awardPoints
                __typename
              }
              minPrice
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
    }`,
    variables: {
      request: {
        pos: null,
        parties: null,
        flightSearchRequest: {
          searchOriginDestinations: [
            {
              origin: origin,
              destination: destination,
              departureDate: departureDate,
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
        customerDetails: [{ custId: "ADT_0", ptc: "ADT" }],
      },
    },
  });

  const requestConfig = {
    method: "post",
    maxBodyLength: Infinity,
    url: config.urls.api,
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      origin: "https://www.virginatlantic.com",
      priority: "u=1, i",
      referer: `https://www.virginatlantic.com/flights/search/slice?origin=${origin}&destination=${destination}&departing=${departureDate}&passengers=a1t0c0i0&awardSearch=true&CTA=AbTest_SP_Flights`,
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
    },
    data: data,
  };

  try {
    const response = await axios.request(requestConfig);
    return response.data;
  } catch (error) {
    console.error("Error fetching award flights:", error.message);
    return null;
  }
}

module.exports = { searchAwardFlights };
