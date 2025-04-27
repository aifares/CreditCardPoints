/**
 * Navigation-related functions for the Air France automation
 */

const { CONFIG } = require("./config");

/**
 * Check if the user is logged in
 * @param {Page} page - Playwright page object
 * @returns {Promise<boolean>} - Whether the user is logged in
 */
async function checkLogin(page) {
  return await page.evaluate(() => {
    // Look for the specific user profile element
    const userNameElement = document.querySelector(
      ".bwc-logo-header__user-name"
    );
    return !!userNameElement;
  });
}

/**
 * Navigate to the rewards search page
 * @param {Page} page - Playwright page object
 * @returns {Promise<boolean>} - Whether navigation was successful
 */
async function navigateToRewardsPage(page) {
  try {
    await page.goto(
      "https://wwws.airfrance.us/search/flights/0?bookingFlow=REWARD",
      {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      }
    );
    console.log("Successfully navigated to rewards search page");

    // Wait for search page to fully load
    await page.waitForTimeout(5000);

    return true;
  } catch (error) {
    console.error("Error navigating to rewards page:", error.message);
    return false;
  }
}

module.exports = {
  checkLogin,
  navigateToRewardsPage,
};
