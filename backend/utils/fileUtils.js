const fs = require('fs');
const path = require('path');

/**
 * Save data to a JSON file
 * @param {string} filename - The filename to save to
 * @param {Object} data - The data to save
 * @returns {Promise<boolean>} - True if successful
 */
function saveToFile(filename, data) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', filename);
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        console.error(`Error saving to ${filename}:`, err);
        reject(err);
        return;
      }
      console.log(`Data saved to ${filename}`);
      resolve(true);
    });
  });
}

/**
 * Read data from a JSON file
 * @param {string} filename - The filename to read from
 * @returns {Promise<Object>} - The parsed JSON data
 */
function readFromFile(filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', filename);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading from ${filename}:`, err);
        reject(err);
        return;
      }
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (parseError) {
        console.error(`Error parsing ${filename}:`, parseError);
        reject(parseError);
      }
    });
  });
}

/**
 * Check if a file exists
 * @param {string} filename - The filename to check
 * @returns {boolean} - True if the file exists
 */
function fileExists(filename) {
  const filePath = path.join(__dirname, '..', filename);
  return fs.existsSync(filePath);
}

/**
 * Combine results from multiple airlines
 * @param {Array} files - Array of filenames to combine
 * @returns {Promise<Array>} - Combined results
 */
async function combineResults(files) {
  try {
    const results = [];
    for (const file of files) {
      if (fileExists(file)) {
        const data = await readFromFile(file);
        results.push(...data);
      }
    }
    
    // Sort by miles/points
    const sortedResults = results.sort((a, b) => a.milesPoints - b.milesPoints);
    
    // Save the combined results
    await saveToFile('combinedResults.json', sortedResults);
    
    return sortedResults;
  } catch (error) {
    console.error('Error combining results:', error);
    throw error;
  }
}

module.exports = {
  saveToFile,
  readFromFile,
  fileExists,
  combineResults
}; 