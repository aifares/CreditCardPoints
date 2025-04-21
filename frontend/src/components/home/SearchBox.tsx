'use client';
import { useState } from "react";
import axios from "axios";

interface FlightResult {
  id: number;
  route: string;
  classType: string;
  milesPoints: number;
  seatsRemaining: number;
  cabinTypes: string[];
  refundable: boolean;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  airlines: string[];
}

export default function SearchBox() {
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [departureDate, setDepartureDate] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>("");
  const [cabin, setCabin] = useState<string>("Economy");
  const [flights, setFlights] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSearch = async () => {
    // Validate inputs
    if (!origin || !destination || !departureDate || !returnDate) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const response = await axios.post("http://localhost:5000/api/search", {
        origin,
        destination,
        departureDate,
        returnDate,
        numAdults: 2 // Default value
      });

      setFlights(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error searching flights:", err);
      setError("Failed to search flights. Please try again.");
      setLoading(false);
    }
  };

  // Format duration from minutes to hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format date and time
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <section className="bg-base-200 rounded-box p-6 shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Where would you like to go?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">From</label>
            <input 
              type="text" 
              placeholder="City or Airport Code (e.g. NYC)" 
              className="input input-bordered w-full" 
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input 
              type="text" 
              placeholder="City or Airport Code (e.g. TYO)" 
              className="input input-bordered w-full" 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Departure</label>
            <input 
              type="date" 
              className="input input-bordered w-full" 
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Return</label>
            <input 
              type="date" 
              className="input input-bordered w-full" 
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Cabin</label>
            <select 
              className="select select-bordered w-full"
              value={cabin}
              onChange={(e) => setCabin(e.target.value)}
            >
              <option>Economy</option>
              <option>Premium Economy</option>
              <option>Business</option>
              <option>First</option>
            </select>
          </div>
        </div>
        {error && <div className="alert alert-error mb-4">{error}</div>}
        <button 
          className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search with Points'}
        </button>
      </section>

      {flights.length > 0 && (
        <section className="bg-base-200 rounded-box p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Available Flights</h2>
          <div className="space-y-4">
            {flights.map((flight) => (
              <div key={`${flight.id}-${flight.classType}`} className="card bg-base-100 shadow-md">
                <div className="card-body p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-primary">{flight.route}</span>
                        <span className="text-sm opacity-70">{flight.airlines.join(', ')}</span>
                      </div>
                      <div className="flex flex-col md:flex-row gap-2 md:gap-6 mb-2">
                        <div>
                          <div className="font-bold">{formatDateTime(flight.departureTime)}</div>
                          <div className="text-sm opacity-70">Departure</div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-sm px-2">
                            <span className="font-semibold">{formatDuration(flight.duration)}</span>
                          </div>
                          <div className="flex-1 h-0.5 bg-base-300"></div>
                          <div className="text-sm px-2">
                            <span className="font-semibold">{flight.cabinTypes.join('/')}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">{formatDateTime(flight.arrivalTime)}</div>
                          <div className="text-sm opacity-70">Arrival</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end mt-2 md:mt-0">
                      <div className="text-2xl font-bold text-primary">{flight.milesPoints.toLocaleString()} miles</div>
                      <div className="text-sm">
                        {flight.seatsRemaining} {flight.seatsRemaining === 1 ? 'seat' : 'seats'} left
                      </div>
                      <div className="mt-2">
                        <button className="btn btn-sm btn-primary">Select</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="badge badge-outline">{flight.classType.replace(/_/g, ' ')}</span>
                    {flight.refundable && <span className="badge badge-success badge-outline">Refundable</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
} 