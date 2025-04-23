// Configuration settings for Virgin Atlantic API
module.exports = {
  credentials: {
    email: "aifares@icloud.com",
    password: "Yankees2009$",
  },
  proxy: {
    server: "http://pr.oxylabs.io:7777",
    username: "customer-points_dlhua-cc-US",
    password: "Changelog12_",
  },
  browser: {
    headless: false, // Use true for headless mode, false for full browser view
  },
  urls: {
    login:
      "https://identity.virginatlantic.com/Identity.Virginatlantic.com/oauth2/v2.0/authorize?p=B2C_1A_VA_DIGITAL_SIGNUP_SIGNIN_CA&client_id=dc6ee747-da45-4f28-aeab-999a89f00855&nonce=defaultNonce&redirect_uri=https%3A%2F%2Fwww.virginatlantic.com%2Fholidays%2Fsso%2Fauth&response_mode=form_post&scope=openid&response_type=id_token&prompt=login&state=https%3A%2F%2Fwww.virginatlantic.com%2Fen-US",
    api: "https://www.virginatlantic.com/flights/search/api/graphql",
  },
  defaultSearch: {
    origin: "JFK",
    destination: "LHR",
    departureDate: "2025-04-27",
  },
};
