/**
 * Advanced Cookie Extractor for Air France
 *
 * INSTRUCTIONS:
 * 1. Log in to Air France in Chrome
 * 2. Press F12 to open Developer Tools
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 * 6. The cookies will be copied to your clipboard automatically
 * 7. Paste them into the Node.js script when prompted
 */

(function extractAirFranceCookies() {
  // Enhanced version that uses Chrome's cookie API if possible
  function getAllCookiesForDomain() {
    return new Promise((resolve) => {
      // Try to use Chrome's advanced cookie API first (only works in secure contexts)
      if (
        typeof chrome !== "undefined" &&
        chrome.cookies &&
        chrome.cookies.getAll
      ) {
        chrome.cookies.getAll({ domain: "airfrance.us" }, (cookies) => {
          resolve(cookies);
        });
      } else {
        // Fallback to document.cookie for regular pages
        const extractedCookies = document.cookie.split(";").map((cookie) => {
          const [name, ...values] = cookie.trim().split("=");
          const value = values.join("=");
          return {
            name,
            value,
            domain: ".airfrance.us",
            path: "/",
            secure: true,
            sameSite: "None",
          };
        });

        resolve(extractedCookies);
      }
    });
  }

  // Format the date for cookie expiration
  function formatCookieDate(date) {
    return date ? new Date(date).toISOString() : undefined;
  }

  // Process cookies to ensure they have all required fields for Playwright
  function processForPlaywright(cookies) {
    return cookies.map((cookie) => {
      const processed = {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain || ".airfrance.us",
        path: cookie.path || "/",
        expires: cookie.expirationDate
          ? formatCookieDate(cookie.expirationDate * 1000)
          : -1,
        httpOnly: !!cookie.httpOnly,
        secure: !!cookie.secure,
        sameSite: cookie.sameSite || "None",
      };
      return processed;
    });
  }

  // Main execution
  getAllCookiesForDomain().then((cookies) => {
    const processedCookies = processForPlaywright(cookies);

    // Create formatted JSON
    const cookieJson = JSON.stringify(processedCookies, null, 2);

    // Display the result
    console.log("Extracted Cookies:");
    console.log(cookieJson);

    // Copy to clipboard
    const textArea = document.createElement("textarea");
    textArea.value = cookieJson;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);

    console.log(
      "\n✅ Cookies copied to clipboard! Paste them into the Node.js script."
    );
    console.log(`Total cookies extracted: ${processedCookies.length}`);
  });
})();
