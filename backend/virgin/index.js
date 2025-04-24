const { chromium } = require("playwright");
const config = require("./config");
const login = require("./login");
const { searchAwardFlights, createApiContext } = require("./api");
const { saveJson } = require("./utils");

/**
 * Main function to run the Virgin Atlantic flight search
 */
async function main() {
  console.log("Starting Virgin Atlantic login and search process...");
  console.log(
    `Headless mode: ${process.env.HEADLESS === "true" ? "enabled" : "disabled"}`
  );
  console.log(`Proxy: ${config.proxy ? "enabled" : "disabled"}`);

  const browser = await chromium.launch({
    headless: false, // Use environment variable to control headless mode
    proxy: config.proxy,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });

  console.log("Browser launched successfully.");

  // Set up browser context with human-like properties
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    hasTouch: false,
    ignoreHTTPSErrors: true,
    javaScriptEnabled: true,
    locale: "en-US",
    timezoneId: "America/New_York",
    geolocation: { longitude: -73.97, latitude: 40.776 }, // New York City coordinates
    permissions: ["geolocation"],
  });

  // Add human-like behaviors to the context
  await context.addInitScript(() => {
    // Add randomized mouse movements
    const randomMove = () => {
      const mouseEvent = new MouseEvent("mousemove", {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: Math.floor(Math.random() * window.innerWidth),
        clientY: Math.floor(Math.random() * window.innerHeight),
      });
      document.dispatchEvent(mouseEvent);
    };

    // Simulate human-like scrolling
    const randomScroll = () => {
      if (Math.random() > 0.7) {
        window.scrollBy({
          top: (Math.random() - 0.5) * 100,
          behavior: "smooth",
        });
      }
    };

    // Set intervals for random movements
    setInterval(randomMove, Math.random() * 3000 + 2000);
    setInterval(randomScroll, Math.random() * 5000 + 3000);
  });

  // Create Playwright API request context for making API calls
  let apiContext = null;
  try {
    apiContext = await createApiContext(context);
  } catch (error) {
    console.warn(
      "⚠️ Unable to create API context, falling back to axios:",
      error.message
    );
  }

  const page = await context.newPage();
  console.log("Browser page created.");

  try {
    // Take screenshots at key points to help with debugging
    const screenshotDir = "./screenshots";
    try {
      require("fs").mkdirSync(screenshotDir, { recursive: true });
    } catch (err) {
      console.warn("Could not create screenshots directory:", err.message);
    }

    // Function to take timestamped screenshots
    const takeScreenshot = async (name) => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const path = `${screenshotDir}/${name}-${timestamp}.png`;
        await page.screenshot({ path, fullPage: true });
        console.log(`Screenshot saved to ${path}`);
      } catch (err) {
        console.warn(`Failed to take screenshot ${name}:`, err.message);
      }
    };

    // Take a screenshot before starting login
    await takeScreenshot("pre-login");

    // Login to Virgin Atlantic starting from homepage
    console.log("Beginning login process...");
    const loginSuccess = await login(page);

    // Take a screenshot after login attempt
    await takeScreenshot("post-login");

    if (!loginSuccess) {
      console.error("❌ Login failed. Exiting.");
      await browser.close();
      return;
    }

    // Simulate taking a short break after login
    const breakTime = Math.random() * 5000 + 3000;
    console.log(
      `✅ Successfully logged in. Taking a short break (${Math.round(
        breakTime / 1000
      )}s)...`
    );
    await page.waitForTimeout(breakTime);

    // Get cookies
    const cookies = await context.cookies();
    if (!cookies.length) {
      console.warn("⚠️ No cookies found.");
      await browser.close();
      return;
    }

    // Save cookies to file
    saveJson("cookies.json", cookies);
    console.log("✅ Cookies saved successfully.");

    // Simulate browsing behavior before search
    await simulateBrowsing(page);

    // Example flight search
    console.log("🔍 Searching for award flights...");
    const flightData = await searchAwardFlights(
      {
        origin: "SFO",
        destination: "LHR",
        departureDate: "2025-04-27",
      },
      cookies,
      apiContext // Pass the Playwright API context for making requests (may be null)
    );

    if (flightData) {
      console.log("✅ Flight data retrieved successfully.");
      saveJson("virgin.json", flightData);
    } else {
      console.error("❌ Failed to retrieve flight data.");
    }
  } catch (error) {
    console.error("Error in main process:", error);
  } finally {
    // Close API context if it exists
    if (apiContext) {
      try {
        await apiContext.dispose();
        console.log("✅ API context closed.");
      } catch (error) {
        console.warn("Error closing API context:", error.message);
      }
    }

    await browser.close();
    console.log("✅ Browser closed. Process complete.");
  }
}

/**
 * Simulate natural browsing behavior to appear more human-like
 * @param {Object} page - Playwright page instance
 */
async function simulateBrowsing(page) {
  console.log("🧑‍💻 Simulating natural browsing behavior...");

  // Random chance to visit Flying Club page
  if (Math.random() > 0.5) {
    try {
      console.log("Visiting Flying Club page...");
      await page.goto("https://www.virginatlantic.com/en-us/flying-club", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Random scrolling
      await page.evaluate(() => {
        const scrollHeight = Math.floor(document.body.scrollHeight * 0.4);
        window.scrollTo({
          top: scrollHeight,
          behavior: "smooth",
        });
      });

      await page.waitForTimeout(Math.random() * 3000 + 2000);
    } catch (error) {
      console.warn("Error during browsing simulation:", error.message);
    }
  }

  // Random chance to visit Travel Information
  if (Math.random() > 0.7) {
    try {
      console.log("Checking travel information...");
      await page.goto(
        "https://www.virginatlantic.com/en-us/travel-information",
        {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        }
      );

      // Random scrolling
      await page.evaluate(() => {
        const scrollHeight = Math.floor(document.body.scrollHeight * 0.3);
        window.scrollTo({
          top: scrollHeight,
          behavior: "smooth",
        });
      });

      await page.waitForTimeout(Math.random() * 4000 + 2000);
    } catch (error) {
      console.warn("Error during browsing simulation:", error.message);
    }
  }

  // Return to homepage before continuing
  try {
    console.log("Returning to homepage...");
    await page.goto(config.urls.homepage, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(Math.random() * 2000 + 1000);
  } catch (error) {
    console.warn("Error returning to homepage:", error.message);
  }
}

/**
 * Search for flights using saved cookies
 * @param {Object} searchParams - Flight search parameters
 * @param {Array} cookies - Saved cookies
 * @returns {Promise<Object>} - Search results
 */
async function searchWithSavedCookies(searchParams, cookies) {
  // Create a temporary browser context just for API requests
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === "true" ? true : false, // Default to headless for API requests
    proxy: config.proxy,
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  });

  // Create API context for requests
  let apiContext = null;
  try {
    apiContext = await createApiContext(context);
  } catch (error) {
    console.warn(
      "⚠️ Unable to create API context, falling back to axios:",
      error.message
    );
  }

  try {
    console.log("🔍 Searching for flights with saved cookies...");

    // Use the apiContext for search (may be null, in which case axios will be used)
    const result = await searchAwardFlights(searchParams, cookies, apiContext);

    return result;
  } catch (error) {
    console.error("Error searching with saved cookies:", error);
    return null;
  } finally {
    // Clean up resources
    if (apiContext) {
      try {
        await apiContext.dispose();
      } catch (error) {
        console.warn("Error closing API context:", error.message);
      }
    }
    await browser.close();
  }
}

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  searchAwardFlights,
  searchWithSavedCookies,
};
