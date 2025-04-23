# Credit Card Points Backend

This is the backend server for the Credit Card Points project. It provides a REST API for retrieving flight data from various airlines using award miles/points.

## Project Structure

```
backend/
├── index.js                  # Main entry point
├── server.js                 # Express server setup
├── routes/                   # API routes
│   └── flights.js            # Flight-related routes
├── services/                 # Service modules for airlines
│   ├── american.js           # American Airlines service
│   ├── airfrance.js          # Air France service
│   └── virgin-atlantic/      # Virgin Atlantic services
├── utils/                    # Utility functions
│   └── fileUtils.js          # File operation utilities
├── american.json             # American Airlines results
├── combinedResults.json      # Combined results from all airlines
├── sortedFlights.json        # Sorted flight results
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   cd backend
   npm install
   ```

### Running the Server

```
npm start
```

For development with auto-reload:
```
npm run dev
```

To clean start (kills processes on ports 5000 and 5001 first):
```
npm run clean-start
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/flights` - Get all flights from combined results
- `GET /api/flights/american` - Get American Airlines flights
- `POST /api/flights/american/search` - Search for American Airlines flights
- `GET /api/flights/virgin` - Get Virgin Atlantic flights
- `GET /api/flights/airfrance` - Get Air France flights
- `POST /api/flights/airfrance/search` - Search for Air France flights
- `GET /api/flights/sorted` - Get sorted flights by miles/points

## Running Individual Airline Services

American Airlines:
```
npm run american
```

Air France:
```
npm run airfrance
```

Virgin Atlantic:
```
npm run virgin
```

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a pull request

## License

ISC 