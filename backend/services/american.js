#!/usr/bin/env node

const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * Fetch American Airlines flight data
 * @param {Object} options - Options for the search
 * @param {string} options.origin - Origin airport code
 * @param {string} options.destination - Destination airport code
 * @param {string} options.departureDate - Departure date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Formatted flight results
 */
async function fetchAmericanFlights(options = {}) {
  try {
    console.log("[AMERICAN] fetchAmericanFlights called with options:", JSON.stringify(options, null, 2));
    
    const origin = options.origin || "NYC";
    const destination = options.destination || "MIA";
    const departureDate = options.departureDate || "2025-04-29";
    
    console.log(`[AMERICAN] Using origin: ${origin}, destination: ${destination}, departureDate: ${departureDate}`);

    let data = JSON.stringify({
      metadata: {
        selectedProducts: [],
        tripType: "OneWay",
        udo: {},
      },
      passengers: [
        {
          type: "adult",
          count: 1,
        },
      ],
      requestHeader: {
        clientId: "AAcom",
      },
      slices: [
        {
          allCarriers: true,
          cabin: "",
          departureDate: departureDate,
          destination: destination,
          destinationNearbyAirports: false,
          maxStops: null,
          origin: origin,
          originNearbyAirports: false,
        },
      ],
      tripOptions: {
        corporateBooking: false,
        fareType: "Lowest",
        locale: "en_US",
        pointOfSale: null,
        searchType: "Award",
      },
      loyaltyInfo: null,
      version: "",
      queryParams: {
        sliceIndex: 0,
        sessionId: "",
        solutionSet: "",
        solutionId: "",
        sort: "CARRIER",
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://www.aa.com/booking/api/search/itinerary",
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US",
        "content-type": "application/json",
        origin: "https://www.aa.com",
        priority: "u=1, i",
        referer:
          "https://www.aa.com/booking/choose-flights/1?sid=3e9004de-c76a-45bf-afc2-8af095206a83",
        "sec-ch-ua":
          '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "x-cid": "8ecad508-11fa-4aec-8713-a84142192b53",
        "x-dtpc":
          "7$477016779_493h29vIULEAUKPLGCIFFBTERLAENMAPKALUEHE-0e0, 7$477016779_493h29vIULEAUKPLGCIFFBTERLAENMAPKALUEHE-0e0",
        "x-xsrf-token": "3537b023-09e0-406d-b3e1-662a6d622f0d",
        Cookie:
          "_abck=87C098369FA74CA01191D52A9951C2D8~-1~YAAQkALEF/FKWEmWAQAAl5CJWg3EbXDUmLhnmsyVlDIwTFQy90vvQiWyOfY0jubo7MZ69WQ0kNHSNdFHyY0LmvV7TlkobKXZSmrbkh5D/Tmf3wuhnuqWT/XXNFGHc/tvrCkB8SZ+ki83rR1zdlXIFt2mv1E3pHFVVk3xdcY9iyZh7v9ouSR3A/f1SqlxuzDB6tpRqlFIHxqMTjGP4O7xIYeFxUvQLdbVDaq9yii3PjUSMRi4Y1tY/Tm7tY2FgazPnHStWJiA6uejKNL5Orpo4tsU1MgJPv0o/OmqwWNp/Z2Jn3hoH4e7IsGju+0t+Ob200KENRI4gEVyha6sNpEoYM7mTGKc0QDgqmcknLVcowBCADIaZou9EtoTnvI35IzofuKn3vnxGj5eSyVJZz+C0qqL5xH2dCbH8mMQ9oO74CBG1MW+BnVn~-1~-1~-1; bm_s=YAAQuQTSF9z7gUiWAQAA/kGeWgO+4rR9rRrWaq2TG2a0ynSLIEa1I/V+4cQ2PXMjjtapG6Ivsfbw4Ij0FQhuT953wBMy05l5GDtQVjETQ2DyB3Tv8ruWNguXWNN8ukarkD6NzKgaDUa9P56HTaDiTkofjrbU1tQlmeYc5jYBPaSBHqfG/4h+v2+WYuDeby+3gXYWPe1od1m1+oKEB7olC1hpbDFO++JCo0/mNnQQtKEcBfRtnT8y77eBMavzzK5ngXNvCfMdUPjoy7KarNcV3M5UuCQtlgESfE9i9AUuFFqsbqkCuLxhuLA0CyU+fW9ZH7lbTUk/RvtM7FrVzwg/yMSU/5clT3uqB6lcw8w/KdIhyFUExUEdj0KwiaAM2GjNjMqc4/9DS9pObP8YeEHb3RB/mAAvVO/qkXXukfSuwHpYG5tyb3lnpg6DnQmtducz1BlHNc0=; bm_ss=e919a75364; bm_sz=0857E556AFE43BB402C9AB53754FB5B5~YAAQuQTSF937gUiWAQAA/kGeWhuXC57GY4s7Z757tVVotCWOUkanWGvI8gmqoJCFa5i7MaHtc45gmh7IFadmIQe9wYaAXzNHXz1CJ5Xc6nLOudmcKDBZqG4nbl6NudL0f0AOyHuIICPPr7YZzlESARiY5fCWwpyf3JmoXQzSW2IdXXVWKnUziCPdjKyW7t8BL+3i5ITQpGfbalfkpK9hQjBuHA2le6bV6UQBv1gmeFCvi6JPsGBG6NlDm0plR7kcy67j986L+ldBDjT7BerjrIqPKWNg481TxOOz1Xw0pPg8m+V5JAnPpKphd74uIt1zepRNx97XvbSWd66NcLFEIKczyDQWML14El12wlfm0zhAOvz+3CnJ18iGJjzcZWBFfii92lPXWIgopyc=~3487800~4535618; aka_cr_code=US-NY; aka_lc_code=ML; aka_state_code=NY; akavpau_www_aafullsite=1745277343~id=fcea587b67c2a2c1f7e7cb5bb926258d",
      },
      data: data,
    };

    try {
      console.log("[AMERICAN] Sending API request to AA.com");
      const response = await axios.request(config);
      
      console.log("[AMERICAN] Received response from AA.com with status:", response.status);
      
      // Save the raw API response for debugging
      const outputPath = path.join(__dirname, '..', 'american-raw.json');
      fs.writeFileSync(
        outputPath,
        JSON.stringify(response.data, null, 2)
      );
      console.log("[AMERICAN] API Response saved to american-raw.json");

      // Check if we can access slices
      if (!response.data) {
        console.log("[AMERICAN] No response data");
        return [];
      }

      console.log("[AMERICAN] Response keys:", Object.keys(response.data));
      
      try {
        const formattedResults = formatAmericanResults(response.data);
        console.log(`[AMERICAN] Formatted ${formattedResults.length} results`);

        const resultsPath = path.join(__dirname, '..', 'american.json');
        fs.writeFileSync(
          resultsPath,
          JSON.stringify(formattedResults, null, 2)
        );
        console.log("[AMERICAN] Formatted results saved to american.json");

        return formattedResults;
      } catch (formatError) {
        console.error("[AMERICAN] Error formatting results:", formatError);
        console.error("[AMERICAN] Format error stack:", formatError.stack);
        return [];
      }
    } catch (requestError) {
      console.error("[AMERICAN] Error making request to AA.com:", requestError.message);
      if (requestError.response) {
        console.error("[AMERICAN] Response status:", requestError.response.status);
        console.error("[AMERICAN] Response data:", typeof requestError.response.data === 'object' 
          ? JSON.stringify(requestError.response.data, null, 2) 
          : requestError.response.data);
      } else if (requestError.request) {
        console.error("[AMERICAN] No response received from AA.com API");
        console.error("[AMERICAN] Request details:", requestError.request._header || 'No request details available');
      }
      console.error("[AMERICAN] Request error stack:", requestError.stack);
      return [];
    }
  } catch (error) {
    console.error("[AMERICAN] General error in fetchAmericanFlights:", error.message);
    console.error("[AMERICAN] Error stack:", error.stack);
    return [];
  }
}

/**
 * Given the raw AA search response, returns an array of award options
 * formatted like the Alaska example:
 * [
 *   { id, route, classType, milesPoints, seatsRemaining, cabinTypes,
 *     refundable, departureTime, arrivalTime, duration, airlines },
 *   …
 * ]
 */
function formatAmericanResults(apiData) {
  console.log("[AMERICAN] formatAmericanResults called");
  
  try {
    const results = [];
    let idCounter = 0;

    if (!apiData.slices || !Array.isArray(apiData.slices)) {
      console.error("[AMERICAN] Missing or invalid slices data:", apiData.slices);
      return [];
    }

    console.log(`[AMERICAN] Formatting ${apiData.slices.length} slices`);

    apiData.slices.forEach((slice, sliceIndex) => {
      try {
        if (!slice.segments || !Array.isArray(slice.segments) || slice.segments.length === 0) {
          console.warn(`[AMERICAN] Slice #${sliceIndex} has no segments`);
          return;
        }
        
        const depSeg = slice.segments[0];
        const arrSeg = slice.segments[slice.segments.length - 1];
        
        if (!depSeg || !depSeg.legs || !depSeg.legs[0] || !depSeg.legs[0].origin) {
          console.warn(`[AMERICAN] Invalid departure segment in slice #${sliceIndex}`);
          return;
        }
        
        if (!arrSeg || !arrSeg.legs || !arrSeg.legs.length) {
          console.warn(`[AMERICAN] Invalid arrival segment in slice #${sliceIndex}`);
          return;
        }
        
        const origin = depSeg.legs[0].origin.code;
        const destination = arrSeg.legs[arrSeg.legs.length - 1].destination.code;
        const departureTime = depSeg.legs[0].departureDateTime;
        const arrivalTime = arrSeg.legs[arrSeg.legs.length - 1].arrivalDateTime;
        const duration = slice.durationInMinutes;
        const airlines = Array.from(
          new Set(slice.segments.map((s) => s.flight.carrierName))
        );

        if (!slice.pricingDetail || !Array.isArray(slice.pricingDetail)) {
          console.warn(`[AMERICAN] No pricing details for slice #${sliceIndex}`);
          return;
        }

        console.log(`[AMERICAN] Processing ${slice.pricingDetail.length} pricing details for slice #${sliceIndex}`);

        slice.pricingDetail.forEach((detail, detailIndex) => {
          try {
            const miles = detail.perPassengerAwardPoints;

            // Only exclude if miles are missing or zero
            if (!miles || miles === 0) {
              console.log(`[AMERICAN] Skipping pricing detail #${detailIndex} - no miles`);
              return;
            }

            results.push({
              id: idCounter++,
              route: `${origin} → ${destination}`,
              classType: detail.productType || "Economy",
              milesPoints: miles,
              seatsRemaining: detail.seatsRemaining ?? null,
              refundable: (detail.refundableProducts || []).length > 0,
              departureTime,
              arrivalTime,
              duration,
              airlines,
              taxAmount: detail.perPassengerTaxesAndFees?.amount ?? 0,
              taxCurrency: detail.perPassengerTaxesAndFees?.currency ?? "USD",
              airlineCode: "AA" // American Airlines code
            });
          } catch (detailError) {
            console.error(`[AMERICAN] Error processing pricing detail #${detailIndex}:`, detailError.message);
          }
        });
      } catch (sliceError) {
        console.error(`[AMERICAN] Error processing slice #${sliceIndex}:`, sliceError.message);
      }
    });

    console.log(`[AMERICAN] Formatted ${results.length} results in total`);
    return results.sort((a, b) => a.milesPoints - b.milesPoints);
  } catch (formatError) {
    console.error("[AMERICAN] General error in formatAmericanResults:", formatError.message);
    console.error("[AMERICAN] Format error stack:", formatError.stack);
    return [];
  }
}

// Run directly when called from command line
if (require.main === module) {
  fetchAmericanFlights()
    .then(results => {
      console.log(`Found ${results.length} flights`);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

module.exports = {
  fetchAmericanFlights,
  formatAmericanResults
}; 