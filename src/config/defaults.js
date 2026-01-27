/**
 * Default Configuration
 * 
 * Default settings for DLest test runner
 */

const defaults = {
  // Base URL for tests (can be overridden per test)
  baseURL: 'http://localhost:3000',
  
  // Browser settings
  browsers: ['chromium'], // chromium, firefox, webkit
  headless: true,
  
  // Test settings
  timeout: 30000, // 30 seconds
  testDir: './tests',
  testMatch: '**/*.test.js',
  
  // Data layer settings
  dataLayer: {
    variableName: 'dataLayer', // Custom data layer variable name
    waitTimeout: 5000,         // How long to wait for events (5 seconds)
  },
  
  // Output settings
  verbose: false,
  colors: true,
  
  // Reporting
  reporter: 'default', // default, json, junit
  
  // Coverage (future feature)
  coverage: {
    enabled: false,
    events: [], // Track coverage for specific events
  },
  
  // Performance
  maxWorkers: 1, // Number of parallel test files (sequential for now)
  
  // Retry settings
  retries: 0, // Number of retries for failed tests
  
  // Playwright specific
  playwright: {
    // Additional Playwright options
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezone: 'America/New_York',
  },

  // Cloud Export (disabled by default)
  export: {
    enabled: false,
    provider: null, // 's3' or 'gcs'

    // S3 configuration
    s3: {
      bucket: null,
      region: 'us-east-1',
      credentials: null,
      pathPrefix: 'test-results'
    },

    // GCS configuration
    gcs: {
      bucket: null,
      projectId: null,
      credentials: null,
      pathPrefix: 'test-results'
    },

    // File naming pattern
    fileNaming: {
      pattern: '{date}/{runId}.jsonl' // Tokens: {date}, {runId}, {branch}, {commit}, {env}
    },

    // What to include in export
    include: {
      testResults: true,
      dataLayerEvents: true,
      networkRequests: true,
      environment: true,
      config: false
    },

    // Error handling
    failOnUploadError: false,
    retries: 3,
    timeout: 30000
  }
};

module.exports = defaults;