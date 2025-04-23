const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import routes
const flightRoutes = require('./routes/flights');
const utilRoutes = require('./routes/utils');

// Import service modules for direct usage
const americanService = require('./services/american');
const airfranceService = require('./services/airfrance');
const virginService = require('./services/virgin');
const alaskaService = require('./services/alaska');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  
  // Log response when it's sent
  const originalSend = res.send;
  res.send = function(body) {
    const responseBody = typeof body === 'string' ? body : JSON.stringify(body);
    console.log(`[${new Date().toISOString()}] Response status: ${res.statusCode}`);
    if (responseBody.length < 1000) {
      console.log('Response body:', responseBody.substring(0, 1000));
    } else {
      console.log('Response body too large to log. Length:', responseBody.length);
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Status route with information about available airline services
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    port: PORT,
    services: {
      american: true,
      virgin: true,
      airfrance: true,
      alaska: true
    },
    apiVersion: '1.0.0'
  });
});

// Direct search endpoint for compatibility with the frontend
app.post('/api/search', async (req, res) => {
  try {
    console.log('[SEARCH] Starting combined search across all airlines via /api/search endpoint...');
    console.log('[SEARCH] Request parameters:', JSON.stringify(req.body, null, 2));
    
    const { origin, destination, departureDate } = req.body;
    
    // Validate required fields
    if (!origin || !destination || !departureDate) {
      console.log('[SEARCH] Missing required fields:', { origin, destination, departureDate });
      return res.status(400).json({ 
        error: "Missing required fields: origin, destination, and departureDate are required" 
      });
    }
    
    console.log('[SEARCH] Starting service requests...');
    
    // Log which services we're calling
    console.log('[SEARCH] Services being called:');
    console.log('[SEARCH] - American Airlines service');
    console.log('[SEARCH] - Virgin Atlantic service');
    console.log('[SEARCH] - Air France service');
    console.log('[SEARCH] - Alaska Airlines service');
    
    const promises = [
      // americanService.fetchAmericanFlights(req.body).catch(err => {
      //   console.error('[SEARCH] American Airlines service error:', err.message);
      //   return [];
      // }),
      virginService.fetchVirginFlights(req.body).catch(err => {
        console.error('[SEARCH] Virgin Atlantic service error:', err.message);
        return [];
      }),
      // airfranceService.fetchAirFranceFlights(req.body).catch(err => {
      //   console.error('[SEARCH] Air France service error:', err.message);
      //   return [];
      // }),
      // alaskaService.fetchAlaskaFlights(req.body).catch(err => {
      //   console.error('[SEARCH] Alaska Airlines service error:', err.message);
      //   return [];
      // })
    ];
    
    console.log('[SEARCH] Waiting for all service promises to settle...');
    const results = await Promise.allSettled(promises);
    console.log('[SEARCH] All service promises have settled');
    
    let combinedResults = [];
    let serviceResults = [];
    
    // Process results from each airline service
    results.forEach((result, index) => {
      const serviceName = ['American', 'Virgin', 'Air France', 'Alaska'][index];
      if (result.status === 'fulfilled') {
        const flightCount = Array.isArray(result.value) ? result.value.length : 0;
        console.log(`[SEARCH] ${serviceName} returned ${flightCount} flights`);
        serviceResults.push({
          service: serviceName,
          status: 'success',
          flightCount
        });
        if (Array.isArray(result.value)) {
          combinedResults = [...combinedResults, ...result.value];
        } else {
          console.error(`[SEARCH] ${serviceName} returned non-array:`, result.value);
        }
      } else {
        console.error(`[SEARCH] ${serviceName} service error:`, result.reason);
        serviceResults.push({
          service: serviceName,
          status: 'error',
          error: result.reason?.message || 'Unknown error'
        });
      }
    });
    
    // Sort by miles/points
    combinedResults.sort((a, b) => a.milesPoints - b.milesPoints);
    
    console.log(`[SEARCH] Combined results: ${combinedResults.length} flights`);
    console.log('[SEARCH] Service results summary:', JSON.stringify(serviceResults, null, 2));
    
    res.json(combinedResults);
  } catch (error) {
    console.error('[SEARCH] Error in combined search:', error);
    console.error('[SEARCH] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to perform combined search',
      message: error.message,
      serviceResults: serviceResults || []
    });
  }
});

// Main routes
app.use('/api/flights', flightRoutes);
app.use('/api/utils', utilRoutes);

// API documentation route
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Credit Card Points API',
    endpoints: {
      '/api/health': 'Health check',
      '/api/status': 'Server status and available services',
      '/api/search': 'Combined search across all airlines (direct endpoint)',
      '/api/flights': 'Get all flights from combined results',
      '/api/flights/american': 'Get American Airlines flights',
      '/api/flights/american/search': 'Search for American Airlines flights',
      '/api/flights/virgin': 'Get Virgin Atlantic flights',
      '/api/flights/virgin/search': 'Search for Virgin Atlantic flights',
      '/api/flights/alaska': 'Get Alaska Airlines flights',
      '/api/flights/alaska/search': 'Search for Alaska Airlines flights',
      '/api/flights/airfrance': 'Get Air France flights',
      '/api/flights/airfrance/search': 'Search for Air France flights',
      '/api/flights/search': 'Combined search across all airlines',
      '/api/flights/sorted': 'Get flights sorted by miles/points',
      '/api/utils/combine-results': 'Manually combine results from all sources',
      '/api/utils/files': 'Get a list of available data files'
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.redirect('/api');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR] Unhandled error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
  console.log(`API documentation available at http://localhost:${PORT}/api`);
});

// Export app for testing
module.exports = app; 