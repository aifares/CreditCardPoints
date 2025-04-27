const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { checkLogin, navigateToRewardsPage } = require("./navigation");
const { performSearch } = require("./search");
const { setupCommandListener } = require("./commands");
const { CONFIG } = require("./config");

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function airFranceAutomation() {
  console.log("Starting Air France automation with cookie authentication");

  // Check if cookie file exists
  if (!fs.existsSync(CONFIG.COOKIES_FILE)) {
    console.log(`Cookie file not found: ${CONFIG.COOKIES_FILE}`);
    console.log(
      "Please make sure your cookies.json file exists in the right location"
    );
    process.exit(1);
  }

  // Launch the browser with headless mode disabled
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--window-size=1280,800",
    ],
  });

  // Create a new browser context
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    ignoreHTTPSErrors: true,
  });

  let page;
  let isLoggedIn = false;
  let refreshInterval;

  try {
    // Load cookies from file
    console.log(`Loading cookies from ${CONFIG.COOKIES_FILE}...`);
    const cookiesJson = fs.readFileSync(CONFIG.COOKIES_FILE, "utf8");
    const cookies = JSON.parse(cookiesJson);
    console.log(`Found ${cookies.length} cookies in file`);

    // Add cookies to browser context
    await context.addCookies(cookies);
    console.log("Cookies added to browser context");

    // Create a new page
    page = await context.newPage();

    // Configure request interception with more natural-looking headers
    await page.route("**/*", (route) => {
      const headers = route.request().headers();
      delete headers["playwright"];
      headers["sec-fetch-dest"] = "document";
      headers["sec-fetch-mode"] = "navigate";
      headers["sec-fetch-site"] = "none";
      route.continue({ headers });
    });

    // Navigate to Air France with improved error handling
    console.log("Navigating to Air France website...");
    try {
      // Use a more reliable waiting strategy with longer timeout
      await page.goto("https://wwws.airfrance.us/", {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
    } catch (navigationError) {
      console.warn("Initial navigation timed out, but continuing anyway...");
      console.warn(
        "This is normal with heavy sites - we'll keep checking for login"
      );
    }

    // Wait a moment for any redirects or additional loading
    await page.waitForTimeout(5000);

    console.log("Please log in manually if you're not already logged in.");
    console.log(
      "The script will continuously check for the login indicator..."
    );

    // Set up initial login check
    isLoggedIn = await checkLogin(page);

    if (!isLoggedIn) {
      console.log("Not logged in yet. Waiting for manual login...");

      // Wait for login (max 10 minutes)
      let attemptCount = 0;
      const maxAttempts = 60;

      while (!isLoggedIn && attemptCount < maxAttempts) {
        await page.waitForTimeout(10000); // Check every 10 seconds
        isLoggedIn = await checkLogin(page);
        attemptCount++;

        if (isLoggedIn) {
          console.log("✅ Login detected!");
          break;
        } else if (attemptCount % 6 === 0) {
          console.log(
            `Still waiting for login... (${Math.floor(
              attemptCount / 6
            )} minute(s) elapsed)`
          );

          // Take a screenshot every 2 minutes
          if (attemptCount % 12 === 0) {
            try {
              await page.screenshot({
                path: `status-${Math.floor(attemptCount / 6)}min.png`,
              });
              console.log(
                `Screenshot saved as status-${Math.floor(
                  attemptCount / 6
                )}min.png`
              );
            } catch (e) {
              // Ignore screenshot errors
            }
          }
        }
      }

      if (!isLoggedIn) {
        console.log("❌ Timed out waiting for login. Please try again.");
        console.log(
          "Browser will remain open. Press Ctrl+C to exit when finished."
        );
        await new Promise(() => {});
        return;
      }
    } else {
      console.log("✅ Already logged in!");
    }

    // Setup periodic cookie refresh and browser refresh every 5 minutes
    console.log("Setting up automatic refresh every 5 minutes...");
    refreshInterval = setInterval(async () => {
      try {
        console.log("\n⟳ Refreshing browser and updating cookies...");
        await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });

        // Wait for page to stabilize after reload
        await page.waitForTimeout(5000);

        // Check if still logged in after refresh
        const stillLoggedIn = await checkLogin(page);
        if (stillLoggedIn) {
          console.log("✅ Still logged in after refresh");

          // Save updated cookies
          const updatedCookies = await context.cookies();
          fs.writeFileSync(
            CONFIG.COOKIES_FILE,
            JSON.stringify(updatedCookies, null, 2)
          );
          console.log(`Cookies updated and saved to ${CONFIG.COOKIES_FILE}`);
        } else {
          console.log(
            "❌ Login lost after refresh. You may need to log in again manually."
          );
        }
      } catch (error) {
        console.error("Error during automatic refresh:", error.message);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Set up command listener
    setupCommandListener(page, context, rl);

    // Initial navigation to rewards page
    console.log("\nNavigating to rewards search page...");
    await navigateToRewardsPage(page);

    // Keep the browser open
    console.log(
      "\nBrowser will remain open. Type commands below or press Ctrl+C to exit."
    );
    console.log("Available commands:");
    console.log(
      "  search <origin> <destination> <departureDate> - Search for flights (e.g., search NYC PAR 2025-09-07)"
    );
    console.log("  refresh - Manually refresh the page and update cookies");
    console.log("  status - Check if still logged in");
    console.log("  help - Show available commands");
  } catch (error) {
    console.error("Error occurred:", error);
    // Take a screenshot on error for debugging
    try {
      if (page) {
        await page.screenshot({ path: "error-screenshot.png" });
      }
    } catch (e) {
      console.error("Could not take screenshot:", e.message);
    }

    // Clear interval if set
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    // Keep the browser open despite error for debugging
    console.log(
      "Browser will remain open for debugging. Press Ctrl+C to exit."
    );

    // Set up command listener even after error
    if (page) {
      setupCommandListener(page, context, rl);
    }
  }
}

module.exports = { airFranceAutomation };
