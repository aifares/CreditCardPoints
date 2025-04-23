const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const config = require("./config");

/**
 * Authenticates with Virgin Atlantic and retrieves cookies
 * @returns {Promise<string>} Cookie header string for API requests
 */
async function authenticate() {
  const browser = await chromium.launch({
    headless: config.browser.headless,
    proxy: {
      server: config.proxy.server,
      username: config.proxy.username,
      password: config.proxy.password,
    },
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Go to Virgin login page
    await page.goto(config.urls.login);
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
    await page.fill("#signInName", config.credentials.email);

    // Wait for password input to appear
    await page.waitForFunction(() => {
      const el = document.querySelector("#password");
      return el && el.type === "password";
    });

    // Fill in password
    await page.fill("#password", config.credentials.password);

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
      await page.screenshot({
        path: path.join(__dirname, "login-failure.png"),
      });
    }

    // Get cookies
    const cookies = await context.cookies();
    if (!cookies.length) {
      console.warn("⚠️ No cookies found.");
    }

    fs.writeFileSync(
      path.join(__dirname, "cookies.json"),
      JSON.stringify(cookies, null, 2)
    );
    console.log(
      `\n✅ Cookies saved to ${path.join(__dirname, "cookies.json")}`
    );

    // Convert cookies array to header format
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    return { browser, cookieHeader };
  } catch (error) {
    console.error("Authentication error:", error);
    await browser.close();
    throw error;
  }
}

module.exports = { authenticate };
