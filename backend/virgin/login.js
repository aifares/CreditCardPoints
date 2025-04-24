const config = require("./config");
const { fetchVerificationCode } = require("./emailUtils");

/**
 * Handles the Virgin Atlantic login process starting from homepage
 * @param {Object} page - Playwright page instance
 * @returns {Promise<boolean>} - Whether login was successful
 */
async function login(page) {
  try {
    // Add anti-bot detection evasion
    await page.addInitScript(() => {
      // Overwrite the navigator properties to evade bot detection
      Object.defineProperty(navigator, "webdriver", { get: () => false });

      // Fake plugins and mime types
      Object.defineProperty(navigator, "plugins", {
        get: () =>
          [1, 2, 3, 4, 5].map(() => ({
            name: "Fake Plugin",
            filename: "fake_plugin.dll",
            description: "This is a fake plugin",
            length: 1,
          })),
      });

      // Fake user gesture to be more human-like
      window.addEventListener("load", () => {
        document.dispatchEvent(new Event("mousemove"));
        document.dispatchEvent(new Event("click"));
      });
    });

    // Start from the homepage with retry
    let loginAttempts = 0;
    const maxLoginAttempts = 3;

    while (loginAttempts < maxLoginAttempts) {
      try {
        loginAttempts++;
        console.log(
          `Navigating to homepage (Attempt ${loginAttempts}/${maxLoginAttempts})...`
        );

        // Navigate to the homepage
        await page.goto("https://www.virginatlantic.com/en-US", {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        // Add some human-like delay
        await page.waitForTimeout(Math.random() * 1500 + 1000);

        // Successfully navigated, break out of retry loop
        break;
      } catch (error) {
        console.warn(
          `Homepage navigation error (Attempt ${loginAttempts}): ${error.message}`
        );

        if (loginAttempts >= maxLoginAttempts) {
          throw new Error(
            `Failed to access homepage after ${maxLoginAttempts} attempts: ${error.message}`
          );
        }

        // Wait before retrying
        await page.waitForTimeout(3000);
      }
    }

    // Accept cookie prompt if it appears
    try {
      await page.waitForSelector('button:has-text("Yes, I Agree")', {
        timeout: config.timeouts.default,
      });
      console.log("Accepting cookies...");
      await page.click('button:has-text("Yes, I Agree")');
      await page.waitForTimeout(Math.random() * 1000 + 500);
    } catch {
      console.log("No cookie prompt found.");
    }

    // Click on the first login button in the header
    console.log("Clicking on login button in header...");
    try {
      // Try finding the button using different selectors
      await page.waitForSelector('button[aria-label="Open logged out menu"]', {
        timeout: config.timeouts.default,
      });
      await page.click('button[aria-label="Open logged out menu"]');
    } catch (error) {
      console.log("First selector failed, trying alternative...");
      try {
        await page.waitForSelector(
          'button[data-testid="button-component"] span:has-text("Log in")',
          {
            timeout: config.timeouts.default,
          }
        );
        await page.click(
          'button[data-testid="button-component"] span:has-text("Log in")'
        );
      } catch (error2) {
        console.log("Second selector failed, trying one more approach...");
        try {
          await page.waitForSelector(
            'button.button-component span:has-text("Log in")',
            {
              timeout: config.timeouts.default,
            }
          );
          await page.click('button.button-component span:has-text("Log in")');
        } catch (error3) {
          // Last resort attempt - take a screenshot and try clicking any login text
          console.log(
            "All button selectors failed, trying last resort approach..."
          );
          await page.screenshot({ path: "login-button-not-found.png" });
          try {
            await page.click('text="Log in"', {
              timeout: config.timeouts.default,
            });
          } catch (finalError) {
            console.error(
              "❌ Could not find any login button to click:",
              finalError.message
            );
            throw new Error("Login button not found");
          }
        }
      }
    }

    // Wait for dropdown to appear and click the login link inside
    console.log("Waiting for dropdown menu to appear...");
    await page.waitForTimeout(Math.random() * 1000 + 1000); // Human-like delay

    // Take a screenshot to see what we're dealing with
    await page.screenshot({ path: "dropdown-menu.png" });

    console.log("Clicking on login link in dropdown...");
    try {
      await page.waitForSelector('a[role="link"] span:has-text("Log in")', {
        timeout: config.timeouts.default,
      });
      await page.click('a[role="link"] span:has-text("Log in")');
    } catch (error) {
      console.log("First dropdown selector failed, trying alternative...");
      try {
        await page.waitForSelector(
          '.dl2D9uRipTpvGcLdlqNq span:has-text("Log in")',
          {
            timeout: config.timeouts.default,
          }
        );
        await page.click('.dl2D9uRipTpvGcLdlqNq span:has-text("Log in")');
      } catch (error2) {
        console.log("Second dropdown selector failed, trying alternative...");
        try {
          // Try more generalized selectors
          await page.waitForSelector('a span:has-text("Log in")', {
            timeout: config.timeouts.default,
          });
          await page.click('a span:has-text("Log in")');
        } catch (error3) {
          console.log("Using fallback approach...");
          // Try clicking any visible element with "Log in" text in the dropdown
          try {
            await page.click('text="Log in"', {
              timeout: config.timeouts.default,
            });
          } catch (finalError) {
            console.error(
              "❌ Could not find login link in dropdown:",
              finalError.message
            );
            await page.screenshot({ path: "login-link-not-found.png" });

            // Try to continue anyway by directly navigating to the login URL
            console.log("Attempting to navigate directly to login URL...");
            await page.goto(
              "https://identity.virginatlantic.com/Identity.Virginatlantic.com/oauth2/v2.0/authorize?p=B2C_1A_VA_DIGITAL_SIGNUP_SIGNIN_CA&client_id=dc6ee747-da45-4f28-aeab-999a89f00855&nonce=defaultNonce&redirect_uri=https%3A%2F%2Fwww.virginatlantic.com%2Fholidays%2Fsso%2Fauth&response_mode=form_post&scope=openid&response_type=id_token&prompt=login&state=https%3A%2F%2Fwww.virginatlantic.com%2Fen-US",
              {
                waitUntil: "domcontentloaded",
                timeout: 60000,
              }
            );
          }
        }
      }
    }

    // Wait for page navigation and login form to appear
    console.log("Waiting for login page to load...");
    try {
      // Use multiple methods to detect page navigation
      await Promise.race([
        page.waitForNavigation({ timeout: config.timeouts.login }),
        page.waitForSelector("#signInName", { timeout: config.timeouts.login }),
        page.waitForSelector("input[name='email']", {
          timeout: config.timeouts.login,
        }),
      ]);

      console.log("Login page loaded, waiting for form to stabilize...");
      await page.waitForTimeout(Math.random() * 2000 + 1000); // Human-like delay
    } catch (error) {
      console.log(
        "Navigation detection failed, will try to continue:",
        error.message
      );
      // Take a screenshot to help debug
      await page.screenshot({ path: "login-page-error.png" });
    }

    // Try multiple selectors for the email field
    let emailFieldSelector = null;
    for (const selector of [
      "#signInName",
      "input[name='email']",
      "#email",
      "input[type='email']",
    ]) {
      try {
        const exists = await page.$(selector);
        if (exists) {
          emailFieldSelector = selector;
          console.log(`Found email field with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!emailFieldSelector) {
      console.error(
        "Could not find email input field. Taking screenshot for debugging..."
      );
      await page.screenshot({ path: "email-field-not-found.png" });
      throw new Error("Email field not found");
    }

    // Add more human-like behavior with random delays between actions
    await page.waitForTimeout(Math.random() * 1000 + 500);

    // Fill in email with human-like typing
    console.log("Entering email address...");
    await page.fill(emailFieldSelector, "");
    for (const char of config.credentials.email) {
      await page.type(emailFieldSelector, char, {
        delay: Math.random() * 100 + 50,
      });
      await page.waitForTimeout(Math.random() * 30);
    }

    // Wait a moment before entering password
    await page.waitForTimeout(Math.random() * 1000 + 800);

    // Check for password field with multiple possible selectors
    let passwordFieldSelector = null;
    for (const selector of [
      "#password",
      "input[name='password']",
      "input[type='password']",
    ]) {
      try {
        const exists = await page.$(selector);
        if (exists) {
          passwordFieldSelector = selector;
          console.log(`Found password field with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!passwordFieldSelector) {
      console.log(
        "Standard password selectors not found, waiting for password field to appear..."
      );
      try {
        await page.waitForFunction(
          () => {
            const passwordFields = Array.from(
              document.querySelectorAll("input")
            ).filter((el) => el.type === "password" || el.name === "password");
            return passwordFields.length > 0;
          },
          { timeout: config.timeouts.default }
        );

        // Get the password field directly from the page
        passwordFieldSelector = await page.evaluate(() => {
          const passwordFields = Array.from(
            document.querySelectorAll("input")
          ).filter((el) => el.type === "password" || el.name === "password");
          if (passwordFields.length > 0) {
            // Create a unique selector for the first password field found
            const field = passwordFields[0];
            if (field.id) return `#${field.id}`;
            if (field.name) return `input[name='${field.name}']`;
            return `input[type='password']`;
          }
          return null;
        });
      } catch (error) {
        console.error("Failed to find password field:", error.message);
        await page.screenshot({ path: "password-field-not-found.png" });
        throw new Error("Password field not found");
      }
    }

    // Fill in password with human-like typing
    console.log("Entering password...");
    await page.fill(passwordFieldSelector, "");
    for (const char of config.credentials.password) {
      await page.type(passwordFieldSelector, char, {
        delay: Math.random() * 100 + 30,
      });
      await page.waitForTimeout(Math.random() * 40);
    }

    // Pause before clicking submit as a human would
    await page.waitForTimeout(Math.random() * 1200 + 800);

    // Find and click the submit button with multiple possible selectors
    console.log("Clicking submit button...");
    let submitButtonClicked = false;

    for (const selector of [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
      "button.primary", // Common class for primary buttons
      "button.submit", // Common class for submit buttons
    ]) {
      try {
        const button = await page.$(selector);
        if (button) {
          console.log(`Found submit button with selector: ${selector}`);
          await button.click();
          submitButtonClicked = true;
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!submitButtonClicked) {
      console.error(
        "Could not find submit button. Taking screenshot for debugging..."
      );
      await page.screenshot({ path: "submit-button-not-found.png" });
      throw new Error("Submit button not found");
    }

    // Wait for navigation after submit
    try {
      await page.waitForNavigation({ timeout: config.timeouts.login });
      await page.waitForTimeout(Math.random() * 2000 + 1000); // Wait after page change
    } catch (error) {
      console.warn(
        "⚠️ Navigation not detected after clicking submit:",
        error.message
      );
      // Continue anyway as some sites don't navigate on login
    }

    // Handle email verification if it appears
    try {
      // Wait for either email verification OR successful login
      const result = await Promise.race([
        page
          .waitForSelector("#readOnlyEmail_ver_but_send", {
            timeout: config.timeouts.default,
          })
          .then(() => "verification"),
        page
          .waitForSelector('button[aria-label="Open logged in menu"]', {
            timeout: config.timeouts.default,
          })
          .then(() => "logged_in"),
      ]);

      if (result === "verification") {
        console.log(
          "Email verification detected, clicking 'Send verification code' button"
        );
        await page.click("#readOnlyEmail_ver_but_send");

        // Wait for verification code input to appear
        await page.waitForSelector("#readOnlyEmail_ver_input", {
          timeout: config.timeouts.default,
        });
        console.log(
          "✅ Verification code sent. Waiting 15 seconds before checking email..."
        );

        // Wait 15 seconds before checking for the email
        console.log("⏱️ Waiting 15 seconds for email to arrive...");
        await page.waitForTimeout(15000); // 15 seconds

        // Fetch verification code from email
        console.log(
          "🔍 Now attempting to fetch verification code from email..."
        );
        let verificationCode = await fetchVerificationCode();

        if (!verificationCode) {
          console.log("\n❗️❗️❗️ MANUAL ACTION REQUIRED ❗️❗️❗️");
          console.log(
            "Unable to automatically retrieve the verification code."
          );
          console.log(
            "Please check your email for a message from Virgin Atlantic with subject:"
          );
          console.log("'Virgin Atlantic account email verification code'");
          console.log(
            "The code should be in the format: 'Your code is: XXXXXX'"
          );
          console.log("Please enter this code in the browser window.");
          console.log("❗️❗️❗️ WAITING FOR MANUAL CODE ENTRY ❗️❗️❗️\n");

          // Pause for manual input as a fallback
          console.log("Waiting for manual verification code entry...");
          await page.waitForTimeout(config.timeouts.verification); // Wait for verification timeout

          // Check if verification button is available and click it
          const verifyButton = await page.$("#readOnlyEmail_ver_but_verify");
          if (verifyButton) {
            await verifyButton.click();
            console.log("Clicked verification button after manual entry");
          }
        } else {
          // Fill in the verification code with human-like typing
          await page.fill("#readOnlyEmail_ver_input", "");
          for (const char of verificationCode) {
            await page.type("#readOnlyEmail_ver_input", char, {
              delay: Math.random() * 150 + 50,
            });
            await page.waitForTimeout(Math.random() * 50);
          }
          console.log(`✅ Entered verification code: ${verificationCode}`);

          // Wait before clicking verify
          await page.waitForTimeout(Math.random() * 1000 + 800);

          // Click verify button
          const verifyButton = await page.$("#readOnlyEmail_ver_but_verify");
          if (verifyButton) {
            await verifyButton.click();
            console.log("Clicked verification button");
          }
        }

        // Now wait for successful login after verification (regardless of automatic or manual entry)
        await page.waitForSelector('button[aria-label="Open logged in menu"]', {
          timeout: config.timeouts.login,
        });
        console.log("✅ Logged in successfully after verification");
      } else {
        console.log(
          "✅ Already logged in successfully - no verification needed"
        );
      }
    } catch (e) {
      console.log(
        "Verification detection error, continuing with normal login flow:",
        e.message
      );
    }

    // Wait for login confirmation - this is now a fallback
    try {
      await page.waitForSelector('button[aria-label="Open logged in menu"]', {
        timeout: config.timeouts.login,
      });
      console.log("✅ Logged in successfully — found post-login button.");
      return true;
    } catch (e) {
      console.warn("⚠️ Login may have failed — post-login button not found.");
      await page.screenshot({ path: "login-failure.png" });
      return false;
    }
  } catch (error) {
    console.error("Login process failed:", error);
    return false;
  }
}

module.exports = login;
