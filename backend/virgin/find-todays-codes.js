/**
 * Script to search for verification codes from Virgin Atlantic emails ONLY
 * Run this with: node find-todays-codes.js
 * Add --after-login flag to only find emails received after the login button was pressed
 */

const Imap = require("imap");
const { simpleParser } = require("mailparser");
const fs = require("fs");
const config = require("./config");

// Create a new IMAP connection
const imap = new Imap({
  user: config.email.imap.user,
  password: config.email.imap.password,
  host: config.email.imap.host,
  port: config.email.imap.port,
  tls: config.email.imap.tls,
  tlsOptions: { rejectUnauthorized: false },
});

// Check for "after login" flag
const afterLoginMode = process.argv.includes("--after-login");
let loginTimestamp = null;

// If running in "after login" mode, get the timestamp from file
if (afterLoginMode && fs.existsSync("./login-timestamp.txt")) {
  const timestampStr = fs.readFileSync("./login-timestamp.txt", "utf8").trim();
  loginTimestamp = new Date(timestampStr);
  console.log(
    `🔍 Only searching for emails after login: ${loginTimestamp.toLocaleString()}`
  );
}

// Connect and search for verification emails
imap.once("ready", function () {
  console.log("✅ Connected to IMAP server");

  imap.openBox("INBOX", false, function (err, box) {
    if (err) throw err;

    // Format today's date for IMAP search
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    // Format date for display (MM/DD/YYYY)
    const formattedDate = `${month + 1}/${day}/${year}`;

    // Format date for IMAP search (DD-MMM-YYYY)
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const searchDate = `${day}-${months[month]}-${year}`;

    // Define different search strategies based on mode
    let searchCriteria;
    let searchDescription;

    if (afterLoginMode && loginTimestamp) {
      // Format the login timestamp for IMAP search
      // IMAP SINCE takes a date in DD-MMM-YYYY format
      const loginDate = `${loginTimestamp.getDate()}-${
        months[loginTimestamp.getMonth()]
      }-${loginTimestamp.getFullYear()}`;

      // For more precise filtering, we'll do a post-search filtering by exact timestamp
      searchCriteria = [
        ["FROM", "msonlineservicesteam"],
        ["SINCE", loginDate],
      ];
      searchDescription = `Virgin Atlantic verification emails since login (${loginTimestamp.toLocaleString()})`;
    } else {
      // Standard search for today's emails if not in after-login mode
      searchCriteria = [
        ["FROM", "msonlineservicesteam"],
        ["ON", searchDate],
      ];
      searchDescription = `Virgin Atlantic verification emails from today (${formattedDate})`;
    }

    console.log(`🔍 Searching for ${searchDescription}...`);

    // Search for Virgin Atlantic verification emails
    imap.search(searchCriteria, function (err, results) {
      if (err) {
        console.error("Search error:", err);
        imap.end();
        return;
      }

      console.log(
        `📬 Found ${results.length} potential Virgin Atlantic verification emails`
      );

      if (!results || results.length === 0) {
        console.log("❌ No Virgin Atlantic verification emails found");

        // Try searching for emails from the past 24 hours instead
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayFormatted = `${yesterday.getDate()}-${
          months[yesterday.getMonth()]
        }-${yesterday.getFullYear()}`;

        console.log(
          `🔍 Trying to search for Virgin Atlantic verification emails from the past 24 hours...`
        );

        imap.search(
          [
            ["FROM", "msonlineservicesteam"],
            ["SINCE", yesterdayFormatted],
          ],
          function (err, recentResults) {
            if (err || !recentResults || recentResults.length === 0) {
              console.log(
                "❌ No recent Virgin Atlantic verification emails found either"
              );

              // Last resort - search for any Virgin Atlantic emails without date filter
              console.log(
                `🔍 Trying one more search for any Virgin Atlantic verification emails...`
              );

              imap.search(
                [["FROM", "msonlineservicesteam"]],
                function (err, anyResults) {
                  if (err || !anyResults || anyResults.length === 0) {
                    console.log(
                      "❌ No Virgin Atlantic verification emails found at all"
                    );
                    imap.end();
                    return;
                  }

                  console.log(
                    `📬 Found ${anyResults.length} Virgin Atlantic verification emails (any date)`
                  );

                  // Sort by newest first
                  anyResults.sort((a, b) => b - a);

                  // Limit to 5 most recent emails
                  const limitedResults =
                    anyResults.length > 5 ? anyResults.slice(0, 5) : anyResults;
                  console.log(
                    `🔍 Processing ${limitedResults.length} most recent Virgin Atlantic verification emails...`
                  );

                  const fetch = imap.fetch(limitedResults, {
                    bodies: "",
                    markSeen: false,
                  });

                  fetchEmails(fetch, "any date");
                }
              );
              return;
            }

            console.log(
              `📬 Found ${recentResults.length} Virgin Atlantic verification emails from the past 24 hours`
            );

            // Sort by newest first
            recentResults.sort((a, b) => b - a);

            // Get all recent results (they're specific enough we want them all)
            console.log(
              `🔍 Processing ${recentResults.length} Virgin Atlantic verification emails from the past 24 hours...`
            );

            const fetch = imap.fetch(recentResults, {
              bodies: "",
              markSeen: false,
            });

            fetchEmails(fetch, "past 24 hours");
          }
        );

        return;
      }

      // Sort to get newest first
      results.sort((a, b) => b - a);

      // Process all Virgin Atlantic emails from today (they're specific enough we want them all)
      console.log(
        `🔍 Processing ${results.length} Virgin Atlantic verification emails...`
      );

      const fetch = imap.fetch(results, {
        bodies: "",
        markSeen: false,
      });

      fetchEmails(fetch, afterLoginMode ? "since login" : "today");
    });

    function fetchEmails(fetch, source) {
      // Create debug directory if it doesn't exist
      if (!fs.existsSync("./debug")) {
        fs.mkdirSync("./debug");
      }

      const now = new Date();
      const foundCodes = [];
      const processedEmails = [];

      fetch.on("message", function (msg, seqno) {
        console.log(`\n----- Processing message #${seqno} -----`);

        msg.on("body", function (stream) {
          simpleParser(stream, (err, parsed) => {
            if (err) {
              console.error("Error parsing email:", err);
              return;
            }

            // Get email details
            const from = parsed.from?.text || "Unknown";
            const subject = parsed.subject || "No Subject";
            const receivedDate = parsed.date || new Date();
            const date = new Date(receivedDate).toLocaleString();

            // Skip non-matching emails that may have been included
            if (
              !from.includes("Microsoft") ||
              !from.includes("Virgin Atlantic") ||
              !subject.includes(
                "Virgin Atlantic account email verification code"
              )
            ) {
              console.log(
                `❌ Skipping email - does not match Virgin Atlantic verification criteria`
              );
              return;
            }

            // If in after-login mode, skip emails received before login
            if (afterLoginMode && loginTimestamp) {
              const emailTimestamp = new Date(receivedDate).getTime();
              const loginTime = loginTimestamp.getTime();

              if (emailTimestamp < loginTime) {
                const timeDiff = Math.round(
                  (loginTime - emailTimestamp) / 1000 / 60
                );
                console.log(
                  `❌ Skipping email received ${timeDiff} minutes BEFORE login`
                );
                return;
              }
            }

            // Calculate minutes ago
            const timestamp = new Date(receivedDate).getTime();
            const minutesAgo = Math.round(
              (now.getTime() - timestamp) / 1000 / 60
            );

            // Store email info
            processedEmails.push({
              seqno,
              from,
              subject,
              date,
              timestamp,
              minutesAgo,
              text: parsed.text || "",
              html: parsed.html || "",
            });

            // Print email details
            console.log(`From: ${from}`);
            console.log(`Subject: ${subject}`);
            console.log(`Date: ${date}`);
            console.log(`Received: ${minutesAgo} minutes ago`);

            // Look for verification code
            const text = parsed.text || "";
            const html = parsed.html || "";
            const content = text + " " + html;

            // Show a preview
            console.log("\nEmail Content Preview:");
            console.log(text.substring(0, 150) + "...");

            // Primary pattern for Virgin Atlantic verification emails
            const virginAtlanticPattern = /Your code is:?\s*(\d{6})/i;
            const match = content.match(virginAtlanticPattern);

            if (match && match[1]) {
              const foundCode = match[1];
              console.log(
                `\n🎯 FOUND VIRGIN ATLANTIC VERIFICATION CODE: ${foundCode}`
              );

              foundCodes.push({
                code: foundCode,
                from,
                subject,
                date,
                seqno,
                timestamp,
                minutesAgo,
              });

              // Save the verification code to a file for easy access
              fs.writeFileSync("./virgin-latest-code.txt", foundCode);

              // Also save a status file with more details about the verification
              fs.writeFileSync(
                "./virgin-verification-status.json",
                JSON.stringify({
                  code: foundCode,
                  timestamp: Date.now(),
                  minutesAgo,
                  from,
                  subject,
                })
              );
            } else {
              console.log(
                "❌ No verification code found in this Virgin Atlantic email"
              );

              // Fallback to other patterns in case format changes
              const codePatterns = [
                { name: "code is", pattern: /code is:?\s*(\d{6})/i },
                {
                  name: "verification code",
                  pattern: /verification code:?\s*(\d{6})/i,
                },
                { name: "6-digit number", pattern: /\b(\d{6})\b/ },
              ];

              for (const { name, pattern } of codePatterns) {
                const fallbackMatch = content.match(pattern);
                if (fallbackMatch && fallbackMatch[1]) {
                  const fallbackCode = fallbackMatch[1];
                  console.log(
                    `\n🎯 FOUND CODE with fallback pattern: ${fallbackCode}`
                  );
                  console.log(`   Pattern matched: ${name}`);

                  foundCodes.push({
                    code: fallbackCode,
                    from,
                    subject,
                    date,
                    seqno,
                    timestamp,
                    minutesAgo,
                    patternUsed: name,
                  });

                  fs.writeFileSync("./virgin-latest-code.txt", fallbackCode);
                  fs.writeFileSync(
                    "./virgin-verification-status.json",
                    JSON.stringify({
                      code: fallbackCode,
                      timestamp: Date.now(),
                      minutesAgo,
                      from,
                      subject,
                    })
                  );

                  break;
                }
              }
            }

            // Save the email for debugging
            const filename = `./debug/virgin_email_${seqno}_${Date.now()}.json`;
            fs.writeFileSync(
              filename,
              JSON.stringify(
                {
                  from,
                  subject,
                  date,
                  receivedDate,
                  minutesAgo,
                  text,
                  html: html.substring(0, 1000),
                },
                null,
                2
              )
            );
            console.log(`💾 Saved email to ${filename}`);
          });
        });
      });

      fetch.once("error", function (err) {
        console.error("Fetch error:", err);
      });

      fetch.once("end", function () {
        console.log(
          `\n✅ Done processing all Virgin Atlantic verification emails from ${source}`
        );

        // Show summary of all processed emails
        console.log(
          `\n📧 VIRGIN ATLANTIC VERIFICATION EMAILS FROM ${source.toUpperCase()}:`
        );
        console.log("====================================================");

        if (processedEmails.length > 0) {
          // Sort by newest first
          processedEmails.sort((a, b) => a.minutesAgo - b.minutesAgo);

          processedEmails.forEach((email, i) => {
            console.log(`\n${i + 1}. From: ${email.from}`);
            console.log(`   Subject: ${email.subject}`);
            console.log(`   Date: ${email.date}`);
            console.log(`   Received: ${email.minutesAgo} minutes ago`);
          });
        } else {
          console.log(
            "No Virgin Atlantic verification emails were successfully processed"
          );
        }

        // Show verification codes found
        if (foundCodes.length > 0) {
          console.log("\n🔑 VIRGIN ATLANTIC VERIFICATION CODES FOUND:");
          console.log("====================================================");

          // Sort by newest first
          foundCodes.sort((a, b) => a.minutesAgo - b.minutesAgo);

          foundCodes.forEach((code, i) => {
            console.log(`\n${i + 1}. Code: ${code.code}`);
            console.log(`   From: ${code.from}`);
            console.log(`   Subject: ${code.subject}`);
            console.log(`   Date: ${code.date}`);
            console.log(`   Received: ${code.minutesAgo} minutes ago`);
            if (code.patternUsed) {
              console.log(`   Pattern: ${code.patternUsed}`);
            }
          });

          console.log(
            `\n✅ Latest Virgin Atlantic verification code saved to ./virgin-latest-code.txt`
          );
        } else {
          console.log(
            "\n❌ No Virgin Atlantic verification codes found in these emails"
          );
        }

        imap.end();
      });
    }
  });
});

imap.once("error", function (err) {
  console.error("IMAP error:", err);
});

imap.once("end", function () {
  console.log("Connection ended");
});

// Start the connection
console.log("🔌 Connecting to IMAP server...");
imap.connect();
