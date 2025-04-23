#!/usr/bin/env node

const axios = require("axios");
const fs = require("fs");

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
      departureDate: "2025-04-29",
      destination: "MIA",
      destinationNearbyAirports: false,
      maxStops: null,
      origin: "NYC",
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

axios
  .request(config)
  .then((response) => {
    // Save the raw API response for debugging
    fs.writeFileSync(
      "american-raw.json",
      JSON.stringify(response.data, null, 2)
    );
    console.log("API Response saved to american-raw.json");

    // Check if we can access slices
    if (!response.data) {
      console.log("No response data");
      return;
    }

    // Log important properties from the response
    console.log("Response keys:", Object.keys(response.data));

    const formattedResults = formatAmericanResults(response.data);
    console.log(`Formatted ${formattedResults.length} results`);

    fs.writeFileSync(
      "american.json",
      JSON.stringify(formattedResults, null, 2)
    );
  })
  .catch((error) => {
    console.log("Error:", error.message);
    if (error.response) {
      console.log("Response status:", error.response.status);
      console.log("Response data:", error.response.data);
    }
  });

// Your formatting function
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
  const results = [];
  let idCounter = 0;

  (apiData.slices || []).forEach((slice) => {
    const depSeg = slice.segments[0];
    const arrSeg = slice.segments[slice.segments.length - 1];
    const origin = depSeg.legs[0].origin.code;
    const destination = arrSeg.legs[arrSeg.legs.length - 1].destination.code;
    const departureTime = depSeg.legs[0].departureDateTime;
    const arrivalTime = arrSeg.legs[arrSeg.legs.length - 1].arrivalDateTime;
    const duration = slice.durationInMinutes;
    const airlines = Array.from(
      new Set(slice.segments.map((s) => s.flight.carrierName))
    );

    (slice.pricingDetail || []).forEach((detail) => {
      const miles = detail.perPassengerAwardPoints;

      // Only exclude if miles are missing or zero
      if (!miles || miles === 0) return;

      results.push({
        id: idCounter++,
        route: `${origin} → ${destination}`,
        classType: detail.productType,
        milesPoints: miles,
        seatsRemaining: detail.seatsRemaining ?? null,
        refundable: (detail.refundableProducts || []).length > 0,
        departureTime,
        arrivalTime,
        duration,
        airlines,
        taxAmount: detail.perPassengerTaxesAndFees?.amount ?? 0,
        taxCurrency: detail.perPassengerTaxesAndFees?.currency ?? "USD",
      });
    });
  });

  return results.sort((a, b) => a.milesPoints - b.milesPoints);
}
