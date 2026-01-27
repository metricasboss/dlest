// DLest Configuration
module.exports = {
  // Base URL for tests
  baseURL: 'http://localhost:3000',
  
  // Browser settings
  browsers: ['chromium'], // chromium, firefox, webkit
  headless: false, // Set to false to see browser in action
  
  // Test settings
  timeout: 30000,
  testDir: './tests',
  testMatch: ['**/*.test.js'],
  
  // Data layer settings
  dataLayer: {
    variableName: 'dataLayer', // Custom data layer variable name
    waitTimeout: 5000,         // How long to wait for events
  },
  
  // Development server settings
  serve: {
    root: './fixtures',        // Serve HTML fixtures from this directory
    port: 3000,               // Default port for dev server
  },
  
  // Output settings
  verbose: false,
  
  // Reporting
  reporter: 'default', // default, json, junit
  
  // Playwright specific settings
  playwright: {
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezone: 'America/New_York',
  }
};
