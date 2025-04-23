// Entry point for Virgin Atlantic flight search
// This file forwards to the modular implementation in the virgin-atlantic directory

const { main } = require('./virgin-atlantic/index');

console.log('Starting Virgin Atlantic flight search...');

// Run the main function when this file is executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('Virgin Atlantic flight search completed!');
    })
    .catch(error => {
      console.error('Error running Virgin Atlantic flight search:', error);
      process.exit(1);
    });
} 