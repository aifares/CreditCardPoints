const { chromium } = require("playwright"); // or 'firefox' or 'webkit'

(async () => {
  // Proxy credentials and URL
  const proxyUser = "customer-points_dlhua-cc-US"; // Replace with your Oxylabs username
  const proxyPass = "Changelog12_"; // Replace with your Oxylabs password
  const proxyHost = "pr.oxylabs.io";
  const proxyPort = 7777;

  // Launch browser without passing proxy in args
  const browser = await chromium.launch({
    proxy: {
      server: "http://pr.oxylabs.io:7777", // Oxylabs proxy server
      username: "customer-points_dlhua-cc-US", // Your Oxylabs username
      password: "Changelog12_", // Your Oxylabs password
    },
    headless: false, // Set to true if you don't need a visible browser
  });
})();
