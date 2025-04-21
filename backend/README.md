# Alaska Airlines Flight Search API

A simple REST API for searching Alaska Airlines flights using miles/points.

## Setup

```bash
npm install
```

## Running the server

```bash
# Start production server
npm start

# Start development server with hot reload
npm run dev
```

The server will start on port 5000 by default (or the port specified in the PORT environment variable).

## API Endpoints

### Search Flights

**POST /api/search**

Search for available flights.

**Request Body:**

```json
{
  "origin": "NYC",
  "destination": "TYO",
  "departureDate": "2025-08-08",
  "returnDate": "2025-09-04",
  "numAdults": 2
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| origin | string | Yes | Origin airport code (e.g., "NYC", "SEA") |
| destination | string | Yes | Destination airport code (e.g., "TYO", "LAX") |
| departureDate | string | Yes | Departure date in YYYY-MM-DD format |
| returnDate | string | Yes | Return date in YYYY-MM-DD format |
| numAdults | number | No | Number of adult passengers (default: 1) |

**Response:**

```json
[
  {
    "id": 3,
    "route": "JFK → HND",
    "classType": "REFUNDABLE_MAIN",
    "milesPoints": 37500,
    "seatsRemaining": 9,
    "cabinTypes": ["COACH"],
    "refundable": true,
    "departureTime": "2025-08-08T10:00:00-04:00",
    "arrivalTime": "2025-08-09T13:20:00+09:00",
    "duration": 860,
    "airlines": ["American Airlines"]
  },
  // ...more flights
]
```

### Health Check

**GET /api/health**

Check if the API is running.

**Response:**

```json
{
  "status": "ok"
}
``` 