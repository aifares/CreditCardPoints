const axios = require("axios");
const fs = require("fs");

// Prepare the data exactly as in your working Postman request
const data = {
  metadata: {
    selectedProducts: [],
    tripType: "RoundTrip",
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
      departureDate: "2025-04-24",
      destination: "LAX",
      destinationNearbyAirports: false,
      maxStops: null,
      origin: "NYC",
      originNearbyAirports: false,
    },
    {
      allCarriers: true,
      cabin: "",
      departureDate: "2025-04-30",
      destination: "NYC",
      destinationNearbyAirports: false,
      maxStops: null,
      origin: "LAX",
      originNearbyAirports: false,
    },
  ],
  tripOptions: {
    corporateBooking: false,
    fareType: "Lowest",
    locale: "en_US",
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
};

const config = {
  method: "post",
  url: "https://www.aa.com/booking/api/search/itinerary",
  headers: {
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US",
    "content-type": "application/json",
    origin: "https://www.aa.com",
    priority: "u=1, i",
    referer:
      "https://www.aa.com/booking/choose-flights/1?sid=3c8367c5-1e21-4567-9a61-b96d2ab9259e",
    "sec-ch-ua":
      '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    "x-cid": "a533ffcf-d161-42d1-b2e8-7ff30f07f4c5",
    "x-dtpc":
      "12$327736059_674h28vJMFTHKPFCPIRAMIMFGPIQNDBMPMFFFQL-0e0, 12$327736059_674h28vJMFTHKPFCPIRAMIMFGPIQNDBMPMFFFQL-0e0",
    "x-xsrf-token": "92042bb1-3fd1-4dab-88c0-e3a2ef6f2b29",
    Cookie:
      "_abck=87C098369FA74CA01191D52A9951C2D8~-1~YAAQjQLEF+oV0UGWAQAAZ4XWVA2I89aHKFs2DaLOHj0NmGUAMrFOnvZRrA7CPEd9qr2lfDjYTiAcKi/qYyvyFGccXfnj2uWgMW2D2R1c2JzZU00o0WsL255o4V9pbDd2Slw/mm3uXDmT46P272O8GYsafBH/pME3aYQPAO1XfMvIFEq+ejscpe1bfP+FpKRG7XBF2DEwVSlGr7IlH9+zxwi0uu+netmPJ4oVV4/fB0YgYl1WzBKen5TGj6b0irswW+cUhEkSs08q4S+Jj5x0vFkiS1gDvgpuSO5sHMN5M+T5K+1+ekPB7mAFKDXR04F/3mLkjmOHGeHsfZS0ntrh2Xh64uBrjQ0391wHJ8KMf+VbsHliA8W1bEu6wPJN3n8AC4CKXtCfG/P3c4fGQpbztvJMCtxCSeLT6CFf2iIa1lcxEM/Ya4e6~-1~-1~-1; bm_s=YAAQEpM2F6KzsE2WAQAAYdjwVAN/mskf4ODlYP9nPhBHH3WtQOS/qHIj4lADXBnu509yzd8o3r9VOGNiIDQ8Es7s7rv2g7NUA8u/wvNenq00pH0DJx5fykwNVHPmGy8xNTgOMKFabN9LihCE2WtSMe2VQxZW+LdcgU1lhKF5o8XF+kantwqy74RXUHKgHygBolgjLrB+6UKymB6b2Gw1oWPfsR/E+STOmrj1dQw9asMWsydem86ZhLjkttFe7kU7AurSfkKP7ooXAQUKImMLT4+7W62jaSpnYgrAuHPZR7pXxcjje8IRfv8P808l7imSb/HEfsLrQHCeeM7bh7UJqU+qwyJOyxLwaNc9Yyjt7UQVHbd5oLyRR+pOmD3QFpseCFo8DoGYoksUsyhdc8tK9OPc0NiE1rtkIvP8SmxojOJXM5I5411l6VZRiFhUgfu8qmKjhkQ=; bm_ss=ab8e18ef4e; bm_sz=1604985A9AAB7E1F1F654A1D96E97C0D~YAAQEpM2F6OzsE2WAQAAYdjwVBs7dQBGRW/KA+wzuhdYY+KR28Ae44a0aCFmAWa1dy+LjlTYSRi40CwEHnVSYx93AC9bjkEprdY7ZO9WkTvZFKt0K0g7C+3JJR+37QxxIWx5jebK/hlzDv3Hx4Upz2A32Uv1oZ+dIEEx0ENTuRmwLbx03th2dJBBsmEllBKk+QpZvG9Cpi/kKWsSnP5Xu2yWkMj39QmiQLauwB3jL4I64yQs/wd1bFbWyAmJcMjjRHO4eEjTFpjlKA13u9Cvc8ImcqQ94amTR12Jdd+94KpsNky5HEPbDg3Qp96auAFFoZxG6znwRbS1ghBTKN1wVHljvOpu3O/61EIMLcsDiz2K/VeWDKNw8NvO/P4REzym3L9bIazH1HkqL/ixWgFCOG2Z~4604469~4535876; aka_cr_code=US-NY; aka_lc_code=ML; aka_state_code=NY; akavpau_www_aafullsite=1745182092~id=898d6ced16ec1e55807a6d895fbf0c9c",
  },
  data: data, // Send as object, let axios handle it
};

axios
  .request(config)
  .then((response) => {
    console.log("Status code:", response.status);
    console.log("Response data type:", typeof response.data);

    // Save the raw response to inspect
    fs.writeFileSync(
      "rawResponse.json",
      JSON.stringify(response.data, null, 2)
    );
    console.log("✅ Saved raw response to rawResponse.json");

    // Check if there are itinerary groups in the response
    if (response.data && response.data.itineraryGroups) {
      console.log(
        "Number of itinerary groups:",
        response.data.itineraryGroups.length
      );

      // Process with your formatting function
      const formatted = formatAmericanResults(response.data);
      console.log("Formatted results count:", formatted.length);

      if (formatted.length > 0) {
        fs.writeFileSync("aaResults.json", JSON.stringify(formatted, null, 2));
        console.log("✅ Saved to aaResults.json");
      } else {
        console.log("❌ No valid results found after formatting");
      }
    } else {
      console.log("❌ No itinerary groups found in response");
      // Log a sample of the response to see its structure
      console.log(
        "Response preview:",
        JSON.stringify(response.data).substring(0, 300) + "..."
      );
    }
  })
  .catch((error) => {
    console.log("❌ Request failed:");
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
      console.log("Headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.log("No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Error message:", error.message);
    }
  });

// Your formatting function
function formatAmericanResults(apiData) {
  const results = [];
  let idCounter = 0;

  if (!Array.isArray(apiData?.itineraryGroups)) return [];

  for (const group of apiData.itineraryGroups) {
    for (const itinerary of group.itineraries || []) {
      const slices = itinerary.slices || [];
      const airlines = new Set();
      const cabinTypes = [];

      const depSegment = slices[0]?.segments?.[0];
      const arrSegment = slices.at(-1)?.segments?.at(-1);

      const origin = depSegment?.origin?.code;
      const destination = arrSegment?.destination?.code;
      const departureTime = depSegment?.departureDateTime;
      const arrivalTime = arrSegment?.arrivalDateTime;

      let duration = 0;
      slices.forEach((slice) => {
        duration += slice.durationMinutes || 0;
        slice.segments.forEach((seg) => {
          if (seg.marketingCarrier?.description)
            airlines.add(seg.marketingCarrier.description);
          if (seg.cabin) cabinTypes.push(seg.cabin);
        });
      });

      for (const option of itinerary.pricingOptions || []) {
        results.push({
          id: idCounter++,
          route: `${origin} → ${destination}`,
          classType: option.productType || "UNKNOWN",
          milesPoints: option.perPassengerAwardPoints ?? null,
          seatsRemaining: option.seatsRemaining ?? null,
          cabinTypes,
          refundable: option.isRefundable ?? false,
          departureTime,
          arrivalTime,
          duration,
          airlines: Array.from(airlines),
        });
      }
    }
  }

  return results
    .filter((r) => r.milesPoints !== null)
    .sort((a, b) => a.milesPoints - b.milesPoints);
}
