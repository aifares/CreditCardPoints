const express = require('express');
const router = express.Router();
const fileUtils = require('../utils/fileUtils');

// Trigger a manual combination of flight results from all sources
router.post('/combine-results', async (req, res) => {
  try {
    console.log('Manually combining flight results...');
    const files = [
      'american.json',
      'virgin-atlantic/virginFlights.json',
      'alaska.json'
      // Add more files as needed
    ];
    
    const combinedResults = await fileUtils.combineResults(files);
    
    res.json({
      success: true,
      message: 'Flight results combined successfully',
      count: combinedResults.length
    });
  } catch (error) {
    console.error('Error combining results:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to combine flight results',
      message: error.message
    });
  }
});

// Get a list of available data files
router.get('/files', (req, res) => {
  try {
    const fileStatus = {
      american: fileUtils.fileExists('american.json'),
      virginAtlantic: fileUtils.fileExists('virgin-atlantic/virginFlights.json'),
      alaska: fileUtils.fileExists('alaska.json'),
      airFrance: fileUtils.fileExists('airfrance.json'),
      combined: fileUtils.fileExists('combinedResults.json'),
      sorted: fileUtils.fileExists('sortedFlights.json')
    };
    
    res.json({
      success: true,
      files: fileStatus
    });
  } catch (error) {
    console.error('Error checking file status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check file status',
      message: error.message
    });
  }
});

module.exports = router; 