const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Cookie file path
const COOKIES_FILE = path.join(__dirname, "cookies.json");

// Instructions for extracting cookies from Chrome
console.log("\n========= HOW TO EXTRACT COOKIES FROM CHROME =========");
console.log("1. Log in to Air France in Chrome browser");
console.log("2. Press F12 to open Developer Tools");
console.log("3. Click on the Console tab");
console.log("4. Paste this code and press Enter:");
console.log(`
(function extractCookies() {
  const cookieData = document.cookie.split(';')
    .map(cookie => {
      const [name, ...values] = cookie.trim().split('=');
      const value = values.join('=');
      return { name, value, domain: '.airfrance.us', path: '/' };
    });
  
  console.log(JSON.stringify(cookieData, null, 2));
  
  // Create a "Copy to clipboard" button
  const textArea = document.createElement('textarea');
  textArea.value = JSON.stringify(cookieData);
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
  
  console.log('Cookies copied to clipboard!');
})();
`);
console.log("5. Copy the resulting JSON");
console.log("6. Come back to this script and paste when prompted");
console.log("==================================================\n");

async function airFranceCookies() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Ask user if they want to use imported cookies
  const importCookies = await new Promise((resolve) => {
    rl.question(
      "Do you want to import cookies from Chrome? (y/n): ",
      (answer) => {
        resolve(answer.toLowerCase() === "y");
      }
    );
  });

  if (importCookies) {
    const cookiesJson = await new Promise((resolve) => {
      rl.question("Paste the cookies JSON from Chrome: ", (answer) => {
        resolve(answer);
      });
    });

    try {
      // Parse and save the cookies
      const cookies = JSON.parse(cookiesJson);

      // Add missing required fields
      const processedCookies = cookies.map((cookie) => ({
        ...cookie,
        domain: cookie.domain || ".airfrance.us",
        path: cookie.path || "/",
        secure: true,
        httpOnly: cookie.httpOnly !== undefined ? cookie.httpOnly : false,
      }));

      fs.writeFileSync(COOKIES_FILE, JSON.stringify(processedCookies, null, 2));
      console.log(
        `Saved ${processedCookies.length} cookies to ${COOKIES_FILE}`
      );
    } catch (error) {
      console.error("Error processing cookies:", error.message);
      console.log("Please try again with valid JSON");
      rl.close();
      return;
    }
  }

  console.log("Starting Air France session with imported cookies");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });

  const context = await browser.newContext();

  // Load cookies from file
  if (fs.existsSync(COOKIES_FILE)) {
    try {
      const cookiesJson = fs.readFileSync(COOKIES_FILE);
      const cookies = JSON.parse(cookiesJson);
      await context.addCookies(cookies);
      console.log(`Loaded ${cookies.length} cookies`);
    } catch (e) {
      console.log("Failed to load cookies:", e);
    }
  }

  const page = await context.newPage();

  try {
    // Navigate to Air France
    console.log("Navigating to Air France...");
    await page.goto("https://wwws.airfrance.us/");

    console.log("\n==== BROWSER INSTRUCTIONS ====");
    console.log("1. Check if you are logged in using imported cookies");
    console.log("2. If not, log in manually");
    console.log("3. Press Q to quit");
    console.log("============================\n");

    // Close the readline interface
    rl.close();

    // Setup keyboard shortcuts for quitting
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdin.on("keypress", async (str, key) => {
      if (key.name === "q") {
        console.log("Quitting...");
        await browser.close();
        process.exit();
      }
    });

    // Keep running
    await new Promise(() => {});
  } catch (error) {
    console.error("Error:", error);
    await browser.close();
  }
}

airFranceCookies().catch(console.error);
