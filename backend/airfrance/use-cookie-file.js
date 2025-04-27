const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// Path to your cookie file - update this if you use a different filename
const COOKIE_FILE = path.join(__dirname, "cookies.json");

async function airFranceWithCookieFile() {
  console.log("Starting Air France session using cookies from file");

  // Check if cookie file exists
  if (!fs.existsSync(COOKIE_FILE)) {
    console.error(`Cookie file not found: ${COOKIE_FILE}`);
    console.log("Please follow these steps:");
    console.log("1. Use the Chrome cookie extractor to get your cookies");
    console.log(
      '2. Save them to a file named "cookies.json" in the same directory as this script'
    );
    process.exit(1);
  }

  // Launch the browser
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });

  const context = await browser.newContext();

  try {
    // Load cookies from file
    const cookiesJson = fs.readFileSync(COOKIE_FILE, "utf8");
    const cookies = JSON.parse(cookiesJson);

    console.log(`Loaded ${cookies.length} cookies from ${COOKIE_FILE}`);
    await context.addCookies(cookies);

    // Open page and navigate to Air France
    const page = await context.newPage();
    console.log("Navigating to Air France website...");

    await page.goto("https://wwws.airfrance.us/", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // Check if we're logged in
    console.log("Checking login status...");

    // Wait a bit for page to fully load
    await page.waitForTimeout(5000);

    // Check for elements that would indicate logged in status
    // You may need to adjust these selectors based on the actual page structure
    const isLoggedIn = await page.evaluate(() => {
      // Look for elements that indicate logged-in state
      const logoutLink = document.querySelector('a[href*="logout"]');
      const accountSection = document.querySelector(
        ".account-section, .user-account, .logged-in"
      );
      const loginButton = document.querySelector(
        'a.login, .login-button, [href*="login"]'
      );

      // If we find logout link or account section, and no login button, we're probably logged in
      return (!!logoutLink || !!accountSection) && !loginButton;
    });

    if (isLoggedIn) {
      console.log("✅ Successfully logged in using cookies!");

      // Example: Now you can navigate to the Flying Blue miles page or other actions
      console.log("You can now automate actions on the site...");

      // Keep the browser open for manual interaction
      console.log("\nPress Ctrl+C to exit the script when finished");
      await new Promise(() => {});
    } else {
      console.log("❌ Not logged in. Cookies may be expired or invalid.");
      console.log(
        "You may need to extract new cookies from Chrome and update your cookie file."
      );

      // Keep browser open for debugging
      console.log("\nPress Ctrl+C to exit the script");
      await new Promise(() => {});
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the script
airFranceWithCookieFile().catch(console.error);
