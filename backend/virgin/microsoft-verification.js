/**
 * Specialized script for finding Microsoft verification emails and codes
 * Run with: node microsoft-verification.js
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

imap.once("ready", function () {
  console.log("✅ Connected to IMAP server");

  imap.openBox("INBOX", false, function (err, box) {
    if (err) throw err;

    console.log(`📬 Total messages in inbox: ${box.messages.total}`);

    // First, get absolute most recent emails
    const total = box.messages.total;
    const start = Math.max(total - 10 + 1, 1);
    const range = `${start}:${total}`;

    console.log(`📩 Fetching the 10 most recent emails first (${range}):`);

    fetchAndProcessEmails(range, "Absolute most recent emails", true);

    function runSearchStrategies() {
      // Get today's date for recent email searches
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);

      // Format dates for IMAP search (DD-MMM-YYYY)
      const formatDate = (date) => {
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
        return `${date.getDate()}-${
          months[date.getMonth()]
        }-${date.getFullYear()}`;
      };

      const todayStr = formatDate(today);
      const yesterdayStr = formatDate(yesterday);
      const lastWeekStr = formatDate(lastWeek);

      // Try multiple search strategies, prioritizing recent emails
      const searches = [
        {
          name: "Microsoft emails from today",
          criteria: [
            ["FROM", "microsoftonline"],
            ["SINCE", todayStr],
          ],
        },
        {
          name: "Verification emails from today",
          criteria: [
            ["SUBJECT", "verification"],
            ["SINCE", todayStr],
          ],
        },
        {
          name: "Code emails from today",
          criteria: [
            ["SUBJECT", "code"],
            ["SINCE", todayStr],
          ],
        },
        {
          name: "Microsoft emails from yesterday",
          criteria: [
            ["FROM", "microsoftonline"],
            ["SINCE", yesterdayStr],
          ],
        },
        {
          name: "Verification emails from yesterday",
          criteria: [
            ["SUBJECT", "verification"],
            ["SINCE", yesterdayStr],
          ],
        },
        {
          name: "Microsoft emails from last week",
          criteria: [
            ["FROM", "microsoftonline"],
            ["SINCE", lastWeekStr],
          ],
        },
        {
          name: "All Microsoft emails",
          criteria: [["FROM", "microsoftonline"]],
        },
        {
          name: "All verification code emails",
          criteria: [["SUBJECT", "verification code"]],
        },
        {
          name: "All emails with 'code' in subject",
          criteria: [["SUBJECT", "code"]],
        },
      ];

      // Run searches sequentially
      runNextSearch(0);

      function runNextSearch(index) {
        if (index >= searches.length) {
          console.log("\n🔍 No more search strategies to try. Exiting.");
          imap.end();
          return;
        }

        const search = searches[index];
        console.log(
          `\n🔍 Search strategy ${index + 1}/${searches.length}: ${search.name}`
        );

        imap.search(search.criteria, function (err, results) {
          if (err) {
            console.error(`Error with search ${search.name}:`, err.message);
            runNextSearch(index + 1);
            return;
          }

          console.log(`📬 Found ${results.length} matching emails`);

          if (results.length === 0) {
            console.log("Trying next search strategy...");
            runNextSearch(index + 1);
            return;
          }

          // We found some emails, fetch them
          fetchAndProcessEmails(results, search.name, false, () => {
            runNextSearch(index + 1);
          });
        });
      }
    }

    function fetchAndProcessEmails(results, searchName, isInitial, callback) {
      console.log(`Fetching emails for: ${searchName}...`);

      // Create debug directory if it doesn't exist
      if (!fs.existsSync("./debug")) {
        fs.mkdirSync("./debug");
      }

      let resultsToFetch = results;

      // If it's not a range string (from initial fetch), sort by sequence number
      if (!isInitial && Array.isArray(results)) {
        // Sort results to get newest messages first (higher numbers are newer)
        const sortedResults = results.sort((a, b) => b - a);

        // Only process up to 10 most recent emails
        resultsToFetch = sortedResults.slice(0, 10);

        console.log(
          `Processing ${resultsToFetch.length} most recent emails from search...`
        );
      }

      const fetch = imap.fetch(resultsToFetch, {
        bodies: "",
        markSeen: false,
      });

      // Keep track of verification codes found
      const foundCodes = [];

      fetch.on("message", function (msg, seqno) {
        console.log(`\n----- Processing email #${seqno} -----`);

        msg.on("body", function (stream) {
          simpleParser(stream, (err, parsed) => {
            if (err) {
              console.error("Error parsing email:", err.message);
              return;
            }

            // Display email summary
            const from = parsed.from?.text || "Unknown";
            const subject = parsed.subject || "No Subject";
            const date = parsed.date
              ? new Date(parsed.date).toLocaleString()
              : "Unknown";

            console.log(`From: ${from}`);
            console.log(`Subject: ${subject}`);
            console.log(`Date: ${date}`);

            // Check for Microsoft or verification related sender
            const isMicrosoft =
              from.toLowerCase().includes("microsoft") ||
              from.toLowerCase().includes("microsoftonline") ||
              from.toLowerCase().includes("verification") ||
              from.toLowerCase().includes("playstation") ||
              from.toLowerCase().includes("sony");

            if (isMicrosoft) {
              console.log("✓ This is a potential verification email");
            }

            // Look for verification codes with different patterns
            const text = parsed.text || "";
            const html = parsed.html || "";

            // Try to extract verification code using various patterns
            const codePatterns = [
              {
                name: "Your code is: 123456",
                pattern: /Your code is:?\s*(\d{4,8})/i,
              },
              { name: "code is: 123456", pattern: /code is:?\s*(\d{4,8})/i },
              {
                name: "verification code: 123456",
                pattern: /verification code:?\s*(\d{4,8})/i,
              },
              {
                name: "security code: 123456",
                pattern: /security code:?\s*(\d{4,8})/i,
              },
              { name: "code: 123456", pattern: /code:?\s*(\d{4,8})/i },
              { name: "6-digit number", pattern: /\b(\d{6})\b/ },
            ];

            let foundCode = null;
            let patternUsed = null;

            // First check in text content
            for (const { name, pattern } of codePatterns) {
              const match = text.match(pattern);
              if (match && match[1]) {
                foundCode = match[1];
                patternUsed = name;
                break;
              }
            }

            // If not found in text, try HTML content
            if (!foundCode) {
              for (const { name, pattern } of codePatterns) {
                const match = html.match(pattern);
                if (match && match[1]) {
                  foundCode = match[1];
                  patternUsed = name;
                  break;
                }
              }
            }

            if (foundCode) {
              console.log(`\n🎯 FOUND VERIFICATION CODE: ${foundCode}`);
              console.log(`   Pattern matched: ${patternUsed}`);
              foundCodes.push({ code: foundCode, from, subject, date, seqno });
            } else {
              console.log("❌ No verification code found in this email");
            }

            // Print email preview
            console.log("\nContent preview:");
            console.log("------------------");
            console.log(text.substring(0, 300) + "...");
            console.log("------------------");

            // Save email to debug directory
            const timestamp = Date.now();
            const filename = `./debug/email_${timestamp}_${seqno}.json`;
            fs.writeFileSync(
              filename,
              JSON.stringify(
                {
                  from,
                  subject,
                  date,
                  text,
                  html,
                },
                null,
                2
              )
            );
            console.log(`📄 Saved to ${filename}`);
          });
        });
      });

      fetch.once("error", function (err) {
        console.error("Fetch error:", err.message);
        if (callback) callback();
      });

      fetch.once("end", function () {
        console.log("\n✅ Done processing emails");

        if (foundCodes.length > 0) {
          console.log("\n🔑 VERIFICATION CODES FOUND:");
          // Sort by sequence number (most recent first)
          foundCodes.sort((a, b) => b.seqno - a.seqno);
          foundCodes.forEach((item, index) => {
            console.log(`\n${index + 1}. Code: ${item.code}`);
            console.log(`   From: ${item.from}`);
            console.log(`   Subject: ${item.subject}`);
            console.log(`   Date: ${item.date}`);
            console.log(`   Message #: ${item.seqno} (higher = more recent)`);
          });

          if (isInitial) {
            console.log(
              "\n✅ Found verification codes in most recent emails. Exiting."
            );
            imap.end();
            return;
          }
        } else if (isInitial) {
          console.log(
            "\n❌ No verification codes found in most recent emails. Trying search strategies..."
          );
          runSearchStrategies();
          return;
        }

        if (callback) callback();
      });
    }
  });
});

imap.once("error", function (err) {
  console.error("IMAP connection error:", err.message);
});

imap.once("end", function () {
  console.log("Connection ended");
});

// Start the connection
console.log("🔌 Connecting to IMAP server...");
imap.connect();
