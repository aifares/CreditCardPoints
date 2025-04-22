const { chromium } = require("playwright");
const fs = require("fs");
const axios = require("axios");

(async () => {
  const browser = await chromium.launch({
    headless: false, // Use true for headless mode, false for full browser view
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to Virgin login page
  await page.goto(
    "https://identity.virginatlantic.com/Identity.Virginatlantic.com/oauth2/v2.0/authorize?p=B2C_1A_VA_DIGITAL_SIGNUP_SIGNIN_CA&client_id=dc6ee747-da45-4f28-aeab-999a89f00855&nonce=defaultNonce&redirect_uri=https%3A%2F%2Fwww.virginatlantic.com%2Fholidays%2Fsso%2Fauth&response_mode=form_post&scope=openid&response_type=id_token&prompt=login&state=https%3A%2F%2Fwww.virginatlantic.com%2Fen-US"
  );
  await page.waitForLoadState("domcontentloaded");

  // Accept cookie prompt if it appears
  try {
    await page.waitForSelector('button:has-text("Yes, I Agree")', {
      timeout: 5000,
    });
    await page.click('button:has-text("Yes, I Agree")');
  } catch {
    console.log("No cookie prompt found.");
  }

  // Fill in email
  await page.waitForSelector("#signInName");
  await page.fill("#signInName", "aifares@icloud.com");

  // Wait for password input to appear
  await page.waitForFunction(() => {
    const el = document.querySelector("#password");
    return el && el.type === "password";
  });

  // Fill in password
  await page.fill("#password", "Yankees2009$");

  // Submit and wait for URL to change
  const currentURL = page.url();
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    try {
      await page.waitForURL((url) => url !== currentURL, { timeout: 15000 });
    } catch {
      console.warn("⚠️ URL didn't change after clicking submit.");
    }
  }

  // Wait for login confirmation
  try {
    await page.waitForSelector('button[aria-label="Open logged in menu"]', {
      timeout: 15000,
    });
    console.log("✅ Logged in successfully — found post-login button.");
  } catch (e) {
    console.warn("⚠️ Login may have failed — post-login button not found.");
    await page.screenshot({ path: "login-failure.png" });
  }

  // Get cookies
  const cookies = await context.cookies();
  if (!cookies.length) {
    console.warn("⚠️ No cookies found.");
  }

  fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));
  console.log("\n✅ Cookies saved.");

  // Convert cookies array to header format
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  // Make authenticated request
  const searchAwardFlights = async ({ origin, destination, departureDate }) => {
    const query = `
      query SearchOffers($request: FlightOfferRequestInput!) {
        searchOffers(request: $request) {
          result {
            slices {
              current
              total
            }
            criteria {
              origin {
                code
                cityName
                countryName
                airportName
              }
              destination {
                code
                cityName
                countryName
                airportName
              }
              departing
            }
            slice {
              id
              fareId
              flightsAndFares {
                flight {
                  segments {
                    airline { code name }
                    flightNumber
                    operatingFlightNumber
                    origin { code cityName airportName }
                    destination { code cityName airportName }
                    duration
                    departure
                    arrival
                    bookingClass
                    fareBasisCode
                  }
                  duration
                  origin { code cityName airportName }
                  destination { code cityName airportName }
                  departure
                  arrival
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
                    }
                  }
                  price {
                    awardPoints
                    tax
                    amountIncludingTax
                    amount
                    currency
                  }
                }
              }
            }
            tripSummary {
              currency
              totalAwardPoints
              totalPrice
            }
            basketId
          }
        }
      }
    `;

    const variables = {
      request: {
        pos: null,
        parties: null,
        flightSearchRequest: {
          searchOriginDestinations: [
            {
              origin,
              destination,
              departureDate,
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
        customerDetails: [
          {
            custId: "ADT_0",
            ptc: "ADT",
          },
        ],
      },
    };

    const headers = {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      origin: "https://www.virginatlantic.com",
      priority: "u=1, i",
      referer:
        "https://www.virginatlantic.com/flights/search/slice?origin=JFK&destination=LHR&departing=2025-04-27&passengers=a1t0c0i0&awardSearch=true",
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
    };

    try {
      const res = await axios.post(
        "https://www.virginatlantic.com/flights/search/api/graphql",
        JSON.stringify({ query, variables }),
        { headers }
      );
      return res.data;
    } catch (error) {
      console.error("Request failed:", error.response?.data || error.message);
      return null;
    }
  };

  // Example usage
  const flightData = await searchAwardFlights({
    origin: "JFK",
    destination: "LHR",
    departureDate: "2025-04-27",
  });

  fs.writeFileSync("virgin.json", JSON.stringify(flightData, null, 2), "utf-8");

  // 🔽 Move this function inside the async block
  const formatMeeloResults = (apiData) => {
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

        const classType = (() => {
          const fareId = fare.fareId || "";
          if (fareId.startsWith("X") || fareId.startsWith("K"))
            return "Economy";
          if (fareId.startsWith("N") || fareId.startsWith("Y"))
            return "Premium Economy";
          if (fareId.startsWith("B") || fareId.startsWith("S"))
            return "Business";
          if (fareId.startsWith("C") || fareId.startsWith("W"))
            return "Upper Class";
          return "Unknown";
        })();

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
  };

  // 🔽 Then call it and write the results
  const formatted = formatMeeloResults(flightData);

  fs.writeFileSync(
    "virginFlights.json",
    JSON.stringify(formatted, null, 2),
    "utf-8"
  );
  console.log("✅ Saved formatted results to virginFlights.json");

  await browser.close();
})();
