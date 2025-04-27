# Air France Miles Automation

This script uses Playwright to automate checking your miles on the Air France website after manually logging in.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Clone this repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
```

## Usage

1. Run the script:

```bash
npm start
```

2. A Chrome browser window will open and navigate to the Air France website
3. Log in manually, completing any CAPTCHA and 2FA steps as needed
4. Once logged in, the script will detect your login and can perform automated actions
5. The browser will stay open to maintain your session

## Customization

You need to update the following in the `airfrance/index.js` file:

1. Replace `.logged-in-user-element` with the actual selector that appears when logged in
2. Uncomment and modify the code for navigating to miles pages and extracting balance

## Important Notes

- The script intentionally keeps the browser open to maintain session cookies
- To stop the script, press Ctrl+C in the terminal
- If the website structure changes, you may need to update the selectors
