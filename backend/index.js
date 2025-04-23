#!/usr/bin/env node

// This is the main entry point for the backend
const server = require('./server');
const fileUtils = require('./utils/fileUtils');

// Export important modules for convenience
module.exports = {
  server,
  fileUtils
};

// If this file is run directly, start the server
if (require.main === module) {
  // Nothing special needs to happen here since server.js already starts the server when imported
  console.log('Starting server from index.js...');
  
  // Schedule periodic tasks
  // For example, combine results from all airlines every hour
  setInterval(async () => {
    try {
      console.log('Combining flight results from all airlines...');
      await fileUtils.combineResults([
        'american.json',
        'virgin-atlantic/virginFlights.json',
        'alaska.json'
        // Add more airlines here as they become available
      ]);
      console.log('Flight results combined successfully.');
    } catch (error) {
      console.error('Error combining flight results:', error);
    }
  }, 60 * 60 * 1000); // Every hour
} 