const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Import service modules
const americanService = require('../services/american');
const airfranceService = require('../services/airfrance');
const virginService = require('../services/virgin');
const alaskaService = require('../services/alaska');

// Get all flights (combined results)
router.get('/', (req, res) => {
  try {
    const combinedResultsPath = path.join(__dirname, '..', 'combinedResults.json');
    if (fs.existsSync(combinedResultsPath)) {
      const combinedResults = require(combinedResultsPath);
      res.json(combinedResults);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading flight data:', error);
    res.status(500).json({ error: 'Failed to load flight data' });
  }
});

// Get American Airlines flights
router.get('/american', (req, res) => {
  try {
    const americanPath = path.join(__dirname, '..', 'american.json');
    if (fs.existsSync(americanPath)) {
      const americanResults = require(americanPath);
      res.json(americanResults);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading American Airlines data:', error);
    res.status(500).json({ error: 'Failed to load American Airlines data' });
  }
});

// Search for American Airlines flights with parameters
router.post('/american/search', async (req, res) => {
  try {
    const { origin, destination, departureDate } = req.body;
    const results = await americanService.fetchAmericanFlights({
      origin,
      destination,
      departureDate
    });
    res.json(results);
  } catch (error) {
    console.error('Error searching American Airlines flights:', error);
    res.status(500).json({ error: 'Failed to search American Airlines flights' });
  }
});

// Get Virgin Atlantic flights
router.get('/virgin', (req, res) => {
  try {
    const virginPath = path.join(__dirname, '..', 'virgin-atlantic', 'virginFlights.json');
    if (fs.existsSync(virginPath)) {
      const virginResults = require(virginPath);
      res.json(virginResults);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading Virgin Atlantic data:', error);
    res.status(500).json({ error: 'Failed to load Virgin Atlantic data' });
  }
});

// Search for Virgin Atlantic flights
router.post('/virgin/search', async (req, res) => {
  try {
    const results = await virginService.fetchVirginFlights(req.body);
    res.json(results);
  } catch (error) {
    console.error('Error searching Virgin Atlantic flights:', error);
    res.status(500).json({ error: 'Failed to search Virgin Atlantic flights' });
  }
});

// Get Alaska Airlines flights
router.get('/alaska', (req, res) => {
  try {
    const alaskaPath = path.join(__dirname, '..', 'alaska.json');
    if (fs.existsSync(alaskaPath)) {
      const alaskaResults = require(alaskaPath);
      res.json(alaskaResults);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading Alaska Airlines data:', error);
    res.status(500).json({ error: 'Failed to load Alaska Airlines data' });
  }
});

// Search for Alaska Airlines flights with parameters
router.post('/alaska/search', async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate, numAdults } = req.body;
    
    // Validate required fields
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ 
        error: "Missing required fields: origin, destination, and departureDate are required" 
      });
    }
    
    const results = await alaskaService.fetchAlaskaFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      numAdults
    });
    res.json(results);
  } catch (error) {
    console.error('Error searching Alaska Airlines flights:', error);
    res.status(500).json({ error: 'Failed to search Alaska Airlines flights' });
  }
});

// Get Air France flights
router.get('/airfrance', (req, res) => {
  try {
    // This is a placeholder, modify as needed
    res.json([]);
  } catch (error) {
    console.error('Error reading Air France data:', error);
    res.status(500).json({ error: 'Failed to load Air France data' });
  }
});

// Search for Air France flights with parameters
router.post('/airfrance/search', async (req, res) => {
  try {
    const results = await airfranceService.fetchAirFranceFlights(req.body);
    res.json(results);
  } catch (error) {
    console.error('Error searching Air France flights:', error);
    res.status(500).json({ error: 'Failed to search Air France flights' });
  }
});

// Get sorted flights
router.get('/sorted', (req, res) => {
  try {
    const sortedPath = path.join(__dirname, '..', 'sortedFlights.json');
    if (fs.existsSync(sortedPath)) {
      const sortedResults = require(sortedPath);
      res.json(sortedResults);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading sorted flight data:', error);
    res.status(500).json({ error: 'Failed to load sorted flight data' });
  }
});

// Combined search endpoint that fetches from all services
router.post('/search', async (req, res) => {
  try {
    console.log('Starting combined search across all airlines...');
    const promises = [
      americanService.fetchAmericanFlights(req.body),
      virginService.fetchVirginFlights(req.body),
      airfranceService.fetchAirFranceFlights(req.body),
      alaskaService.fetchAlaskaFlights(req.body)
    ];
    
    const results = await Promise.allSettled(promises);
    
    let combinedResults = [];
    
    // Process results from each airline service
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        combinedResults = [...combinedResults, ...result.value];
      } else {
        console.error(`Error with service #${index}:`, result.reason);
      }
    });
    
    // Sort by miles/points
    combinedResults.sort((a, b) => a.milesPoints - b.milesPoints);
    
    res.json(combinedResults);
  } catch (error) {
    console.error('Error in combined search:', error);
    res.status(500).json({ error: 'Failed to perform combined search' });
  }
});

module.exports = router; 