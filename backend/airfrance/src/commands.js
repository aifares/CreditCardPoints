/**
 * Command handling for the Air France automation
 */

const fs = require("fs");
const { CONFIG } = require("./config");
const { checkLogin } = require("./navigation");
const { performSearch } = require("./search");

/**
 * Set up the command listener
 * @param {Page} page - Playwright page object
 * @param {BrowserContext} context - Playwright browser context
 * @param {readline.Interface} rl - Readline interface
 */
function setupCommandListener(page, context, rl) {
  rl.on("line", async (input) => {
    const args = input.trim().split(/\s+/);
    const command = args[0]?.toLowerCase();

    switch (command) {
      case "search":
        if (args.length >= 4) {
          const origin = args[1].toUpperCase();
          const destination = args[2].toUpperCase();
          const departureDate = args[3];

          // Create search parameters
          const searchParams = {
            origin,
            destination,
            departureDate,
          };

          console.log(
            `Searching for flights: ${origin} to ${destination} on ${departureDate}`
          );
          await performSearch(page, searchParams);
        } else {
          console.log("Usage: search <origin> <destination> <departureDate>");
          console.log("Example: search NYC PAR 2025-09-07");
        }
        break;

      case "refresh":
        console.log("Manually refreshing the page and updating cookies...");
        try {
          await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
          const stillLoggedIn = await checkLogin(page);
          if (stillLoggedIn) {
            console.log("✅ Still logged in after refresh");
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
          console.error("Error during manual refresh:", error.message);
        }
        break;

      case "status":
        const loggedIn = await checkLogin(page);
        if (loggedIn) {
          console.log("✅ Currently logged in");
        } else {
          console.log("❌ Not currently logged in");
        }
        break;

      case "help":
        console.log("Available commands:");
        console.log(
          "  search <origin> <destination> <departureDate> - Search for flights (e.g., search NYC PAR 2025-09-07)"
        );
        console.log("  refresh - Manually refresh the page and update cookies");
        console.log("  status - Check if still logged in");
        console.log("  help - Show this help message");
        break;

      default:
        if (input.trim()) {
          console.log(
            `Unknown command: ${command}. Type 'help' for available commands.`
          );
        }
    }
  });
}

module.exports = { setupCommandListener };
