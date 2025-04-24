const fs = require("fs");

/**
 * Save data to a JSON file
 * @param {String} filename - Name of the file to save
 * @param {Object} data - Data to save
 * @returns {Boolean} - Success status
 */
function saveJson(filename, data) {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), "utf-8");
    console.log(`✅ Data saved to ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to save data to ${filename}:`, error.message);
    return false;
  }
}

/**
 * Load data from a JSON file
 * @param {String} filename - Name of the file to load
 * @returns {Object|null} - Loaded data or null on failure
 */
function loadJson(filename) {
  try {
    if (!fs.existsSync(filename)) {
      console.warn(`⚠️ File ${filename} does not exist.`);
      return null;
    }

    const data = JSON.parse(fs.readFileSync(filename, "utf-8"));
    console.log(`✅ Data loaded from ${filename}`);
    return data;
  } catch (error) {
    console.error(`❌ Failed to load data from ${filename}:`, error.message);
    return null;
  }
}

/**
 * Format a date for display
 * @param {String} dateString - ISO date string
 * @returns {String} - Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

module.exports = {
  saveJson,
  loadJson,
  formatDate,
};
