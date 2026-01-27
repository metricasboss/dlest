// DLest Configuration Example with Cloud Export
module.exports = {
  // Base URL for tests
  baseURL: 'http://localhost:3000',

  // Browser settings
  browsers: ['chromium'], // chromium, firefox, webkit
  headless: true,

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
  },

  // Cloud Export Configuration
  export: {
    // Enable/disable export
    enabled: true,

    // Provider: 's3' or 'gcs'
    provider: 's3',

    // AWS S3 Configuration
    s3: {
      bucket: 'my-dlest-results',
      region: 'us-east-1',

      // IMPORTANT: Use environment variables instead of hardcoding credentials
      // credentials: {
      //   accessKeyId: process.env.DLEST_EXPORT_S3_ACCESS_KEY_ID,
      //   secretAccessKey: process.env.DLEST_EXPORT_S3_SECRET_ACCESS_KEY
      // },

      pathPrefix: 'test-results'
    },

    // Google Cloud Storage Configuration
    gcs: {
      bucket: 'my-dlest-results',
      projectId: 'my-project-id',

      // IMPORTANT: Use environment variables or service account file
      // credentials: require('./service-account.json'),

      pathPrefix: 'test-results'
    },

    // File naming pattern
    // Available tokens: {date}, {runId}, {branch}, {commit}, {env}
    fileNaming: {
      pattern: '{date}/{runId}.jsonl'
      // Examples:
      // '{branch}/{date}/{runId}.jsonl'
      // '{env}/{date}/{commit}-{runId}.jsonl'
    },

    // What to include in export
    include: {
      testResults: true,      // Individual test results
      dataLayerEvents: true,  // DataLayer events captured during tests
      networkRequests: true,  // Network requests (future)
      environment: true,      // Git, CI, system info
      config: false          // Config (credentials stripped)
    },

    // Error handling
    failOnUploadError: false, // Don't fail tests if upload fails
    retries: 3,              // Retry attempts for upload
    timeout: 30000           // Upload timeout in ms
  }
};

// Alternative: Use environment variables
// Set these in your environment or CI/CD:
//
// export DLEST_EXPORT_ENABLED=true
// export DLEST_EXPORT_PROVIDER=s3
// export DLEST_EXPORT_S3_BUCKET=my-dlest-results
// export DLEST_EXPORT_S3_REGION=us-east-1
// export DLEST_EXPORT_S3_ACCESS_KEY_ID=AKIA...
// export DLEST_EXPORT_S3_SECRET_ACCESS_KEY=...
// export DLEST_EXPORT_FILE_PATTERN="{date}/{runId}.jsonl"
