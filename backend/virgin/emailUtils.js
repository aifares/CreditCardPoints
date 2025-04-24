const Imap = require("imap");
const { simpleParser } = require("mailparser");
const config = require("./config");
const fs = require("fs");

/**
 * Extract verification code from email body
 * @param {string} emailBody - The body of the email
 * @param {Object} emailData - The parsed email data
 * @returns {string|null} - The verification code or null if not found
 */
function extractVerificationCode(emailBody, emailData) {
  console.log("Examining email for verification code...");
  console.log(`From: ${emailData.from?.text}`);
  console.log(`Subject: ${emailData.subject}`);

  // Define multiple patterns to match verification codes
  const patterns = [
    // Pattern for "Your code is: XXXXXX" format
    /Your code is:?\s*(\d+)/i,
    // Pattern for "code is: XXXXXX" format
    /code is:?\s*(\d+)/i,
    // Pattern for "verification code: XXXXXX"
    /verification code:?\s*(\d+)/i,
    // Microsoft specific patterns
    /security code:?\s*(\d+)/i,
    /code:?\s*(\d+)/i,
    // Last resort - find any 6 digit number
    /\b(\d{6})\b/,
  ];

  // Try each pattern in sequence
  for (const pattern of patterns) {
    const match = emailBody.match(pattern);
    if (match && match[1]) {
      console.log(`✅ Verification code found using pattern: ${pattern}`);
      return match[1];
    }
  }

  // If the email is from Microsoft Online Services team, look for any number as a last resort
  if (
    emailData.from &&
    emailData.from.text &&
    emailData.from.text.includes("microsoftonline.com")
  ) {
    const microsoftPattern = /\b(\d+)\b/g;
    const numbers = [...emailBody.matchAll(microsoftPattern)]
      .map((match) => match[1])
      .filter((num) => num.length >= 4 && num.length <= 8); // Most codes are 4-8 digits

    if (numbers.length > 0) {
      console.log(
        `✅ Found potential Microsoft verification code: ${numbers[0]}`
      );
      return numbers[0];
    }
  }

  console.log("❌ No verification code found in email.");
  // Print the first 500 characters of the email body for debugging
  console.log("Email content preview:");
  console.log(emailBody.substring(0, 500) + "...");
  return null;
}

/**
 * Connect to IMAP server with retries
 * @param {Object} imapConfig - IMAP configuration object
 * @returns {Promise<Imap>} - Connected IMAP client
 */
function connectToImap(imapConfig) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    const onReady = () => {
      imap.removeListener("error", onError);
      resolve(imap);
    };

    const onError = (err) => {
      imap.removeListener("ready", onReady);
      reject(err);
    };

    imap.once("ready", onReady);
    imap.once("error", onError);

    imap.connect();
  });
}

/**
 * Get emails matching search criteria
 * @param {Imap} imap - Connected IMAP client
 * @param {Array} searchCriteria - Search criteria for finding emails
 * @returns {Promise<Array>} - Array of email objects
 */
function getEmails(imap, searchCriteria) {
  return new Promise((resolve, reject) => {
    imap.openBox("INBOX", false, (err, box) => {
      if (err) return reject(err);

      imap.search(searchCriteria, (err, results) => {
        if (err) return reject(err);

        if (!results || results.length === 0) {
          return resolve([]);
        }

        const fetch = imap.fetch(results, {
          bodies: "",
          markSeen: true,
        });

        const emails = [];

        fetch.on("message", (msg) => {
          msg.on("body", (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (err) return;
              emails.push(parsed);
            });
          });
        });

        fetch.on("error", (err) => {
          reject(err);
        });

        fetch.once("end", () => {
          resolve(emails);
        });
      });
    });
  });
}

/**
 * Get the most recent emails from inbox (for debugging)
 * @param {Imap} imap - Connected IMAP client
 * @param {number} count - Number of recent emails to fetch
 * @returns {Promise<Array>} - Array of recent emails
 */
async function getRecentEmails(imap, count = 5) {
  return new Promise((resolve, reject) => {
    imap.openBox("INBOX", false, (err, box) => {
      if (err) return reject(err);

      // Calculate range to fetch the most recent emails
      const total = box.messages.total;
      const start = Math.max(total - count + 1, 1); // Ensure we don't go below 1
      const range = `${start}:${total}`;

      console.log(
        `📬 Fetching the last ${count} emails (${range}) out of ${total} total emails`
      );

      const fetch = imap.fetch(range, {
        bodies: "",
        markSeen: false, // Don't mark as seen when just checking
      });

      const emails = [];

      fetch.on("message", (msg) => {
        msg.on("body", (stream) => {
          simpleParser(stream, (err, parsed) => {
            if (err) return;
            emails.push(parsed);
          });
        });
      });

      fetch.on("error", (err) => {
        reject(err);
      });

      fetch.once("end", () => {
        resolve(emails);
      });
    });
  });
}

/**
 * Print summary of recent emails for debugging
 * @param {Array} emails - Array of email objects
 */
function printRecentEmailsSummary(emails) {
  console.log("\n=== 📧 RECENT EMAILS IN INBOX ===");
  if (emails.length === 0) {
    console.log("❌ No emails found in inbox");
    return;
  }

  // Sort by date (newest first)
  emails.sort((a, b) => new Date(b.date) - new Date(a.date));

  emails.forEach((email, index) => {
    const from = email.from?.text || "Unknown";
    const subject = email.subject || "No Subject";
    const date = email.date ? new Date(email.date).toLocaleString() : "Unknown";

    console.log(`📩 #${index + 1} [${date}] From: ${from}`);
    console.log(`   Subject: ${subject}`);

    // Print a preview of the content
    const text = email.text || "";
    if (text.length > 0) {
      const preview = text.replace(/\s+/g, " ").trim().substring(0, 100);
      console.log(`   Preview: ${preview}${text.length > 100 ? "..." : ""}`);
    }
    console.log(""); // Add a blank line between emails
  });
  console.log("=== END OF RECENT EMAILS ===\n");
}

/**
 * Fetch verification code from email with retries
 * @returns {Promise<string|null>} - Verification code or null if not found
 */
async function fetchVerificationCode() {
  console.log(
    "✨ Starting email verification code retrieval after the 15-second wait..."
  );
  console.log(
    `📧 Email configuration: ${config.email.imap.user} @ ${config.email.imap.host}`
  );

  // Try to get the verification code using the dedicated script first
  try {
    console.log(
      "🔍 Executing specialized Virgin Atlantic verification code finder..."
    );
    // Use the child_process module to run our dedicated script
    const { execSync } = require("child_process");
    const path = require("path");

    // Get the path to the script
    const scriptPath = path.join(__dirname, "find-todays-codes.js");

    // Run the script
    execSync(`node ${scriptPath}`, { timeout: 30000 });

    // Check if the code was saved to the file
    if (fs.existsSync("./virgin-latest-code.txt")) {
      const code = fs.readFileSync("./virgin-latest-code.txt", "utf8").trim();

      if (code && code.length >= 4) {
        console.log(
          `✅ Found Virgin Atlantic verification code using dedicated script: ${code}`
        );
        return code;
      }
    }

    console.log(
      "⚠️ Dedicated script didn't find a verification code, falling back to standard method"
    );
  } catch (error) {
    console.error(
      "❌ Error running dedicated verification code script:",
      error.message
    );
    console.log("⚠️ Falling back to standard email checking method");
  }

  // Fall back to the original implementation
  const maxAttempts = Math.ceil(
    config.email.maxWaitTime / config.email.checkInterval
  );
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`🔄 Attempt ${attempts} of ${maxAttempts} to fetch email...`);

      console.log("📌 Connecting to IMAP server...");
      const imap = await connectToImap(config.email.imap);
      console.log("✅ Connected to IMAP server");

      // First, get and print the last 5 emails in inbox for debugging
      try {
        console.log("📄 Fetching the last 5 emails in inbox for debugging...");
        const recentEmails = await getRecentEmails(imap, 5);
        printRecentEmailsSummary(recentEmails);
      } catch (recentErr) {
        console.error("❌ Error fetching recent emails:", recentErr.message);
      }

      // Try various search strategies to find verification emails
      console.log("📌 Searching for verification emails...");

      // Strategy 1: Look for emails from Microsoft on behalf of Virgin Atlantic
      let emails = await searchEmails(imap, ["FROM", "msonlineservicesteam"]);
      console.log(
        `📬 Found ${emails.length} emails from Microsoft/Virgin Atlantic`
      );

      // If we found emails, check them for verification codes
      if (emails.length > 0) {
        const foundCode = await checkEmailsForCode(emails);
        if (foundCode) {
          imap.end();
          return foundCode;
        }
      }

      // Strategy 2: Look for unseen emails (most likely to be recent verification)
      emails = await searchEmails(imap, ["UNSEEN"]);
      console.log(`📬 Found ${emails.length} unseen emails`);

      // If no unseen emails or code not found, try searching by subject
      if (emails.length === 0 || !(await checkEmailsForCode(emails))) {
        console.log(
          "📌 Searching for emails with 'verification' in subject..."
        );
        emails = await searchEmails(imap, ["SUBJECT", "verification"]);
        console.log(
          `📬 Found ${emails.length} emails with 'verification' in subject`
        );

        if (emails.length === 0 || !(await checkEmailsForCode(emails))) {
          // Try various other search terms
          console.log("📌 Trying additional search terms...");
          const searchTerms = [
            ["SUBJECT", "Virgin Atlantic account"],
            ["SUBJECT", "code"],
            ["SUBJECT", "Microsoft"],
            ["SUBJECT", "Virgin"],
          ];

          for (const term of searchTerms) {
            if (emails.length > 0) break;
            console.log(
              `📌 Searching for emails with ${term[0]}=${term[1]}...`
            );
            emails = await searchEmails(imap, term);
            console.log(`📬 Found ${emails.length} emails`);

            // Check if any of these emails contain a code
            if (emails.length > 0) {
              const foundCode = await checkEmailsForCode(emails);
              if (foundCode) {
                imap.end();
                return foundCode;
              }
            }
          }
        }
      }

      imap.end();

      // No code found, wait and try again
      console.log(
        `⏱️ No verification code found. Waiting ${config.email.checkInterval} seconds before trying again...`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, config.email.checkInterval * 1000)
      );
    } catch (error) {
      console.error("❌ Error checking email:", error.message);
      if (error.source) console.error("Error source:", error.source);
      console.log(
        `⏱️ Waiting ${config.email.checkInterval} seconds before trying again...`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, config.email.checkInterval * 1000)
      );
    }
  }

  console.error(
    `❌ Failed to find verification code after ${maxAttempts} attempts.`
  );
  return null;
}

/**
 * Search for emails using IMAP search criteria
 * @param {Imap} imap - Connected IMAP client
 * @param {Array} criteria - IMAP search criteria
 * @returns {Promise<Array>} - Array of matching emails
 */
async function searchEmails(imap, criteria) {
  return new Promise((resolve, reject) => {
    imap.search(criteria, (err, results) => {
      if (err) {
        console.error("Search error:", err);
        return resolve([]);
      }

      if (!results || results.length === 0) {
        return resolve([]);
      }

      const fetch = imap.fetch(results, {
        bodies: "",
        markSeen: false,
      });

      const emails = [];

      fetch.on("message", (msg) => {
        msg.on("body", (stream) => {
          simpleParser(stream, (err, parsed) => {
            if (err) return;
            emails.push(parsed);
          });
        });
      });

      fetch.on("error", (err) => {
        console.error("Fetch error:", err);
        resolve([]);
      });

      fetch.once("end", () => {
        // Sort by date (newest first)
        emails.sort((a, b) => new Date(b.date) - new Date(a.date));
        resolve(emails);
      });
    });
  });
}

/**
 * Check a set of emails for verification codes
 * @param {Array} emails - Array of emails to check
 * @returns {Promise<string|null>} - Verification code if found, null otherwise
 */
async function checkEmailsForCode(emails) {
  if (!emails || emails.length === 0) return null;

  // Save emails for debugging
  try {
    // Create debug directory if it doesn't exist
    if (!fs.existsSync("./debug")) {
      fs.mkdirSync("./debug");
    }

    // Save each email for inspection
    emails.forEach((email, index) => {
      const filename = `./debug/email_${Date.now()}_${index}.json`;
      fs.writeFileSync(
        filename,
        JSON.stringify(
          {
            from: email.from?.text,
            subject: email.subject,
            date: email.date,
            text: email.text,
            html: email.html,
          },
          null,
          2
        )
      );
      console.log(`📄 Saved debug email to ${filename}`);
    });
  } catch (err) {
    console.error("Error saving debug emails:", err);
  }

  // Process each email looking for verification codes
  for (const email of emails) {
    const text = email.text || "";
    console.log("📄 Email content preview:", text.substring(0, 100) + "...");
    const code = extractVerificationCode(text, email);
    if (code) {
      console.log(`✅ Found verification code: ${code}`);
      return code;
    }
  }

  return null;
}

module.exports = {
  fetchVerificationCode,
  getRecentEmails,
  printRecentEmailsSummary,
  searchEmails,
  checkEmailsForCode,
  extractVerificationCode,
};
