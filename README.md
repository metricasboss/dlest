# DLest

[![npm version](https://badge.fury.io/js/dlest.svg)](https://www.npmjs.com/package/dlest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/dlest.svg)](https://nodejs.org)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://metricasboss.github.io/dlest/)

**Jest for your data layer** - A test runner specifically designed for testing analytics tracking implementations.

DLest provides familiar Jest-like syntax for validating data layer events in web applications. Built on top of Playwright, it allows developers to write unit tests for their analytics implementations and catch tracking bugs before they reach production.

## Why DLest?

- 🧪 **Jest-like API** - Familiar syntax for JavaScript developers
- 🎯 **Purpose-built** - Designed specifically for analytics testing
- 🚀 **Fast & Reliable** - Built on Playwright for real browser testing
- 🌐 **Remote Testing** - Test staging/production sites directly
- ☁️ **Cloud Export** - Export test results to S3/GCS for dashboards
- 📦 **Zero Config** - Works out of the box with sensible defaults
- 🔧 **Extensible** - Custom matchers and templates for your needs
- 🛠️ **Built-in Server** - No need for Python or external tools
- 🔍 **Verbose Mode** - Detailed debugging with event inspection
- 💡 **Smart Error Messages** - Helpful tips in Portuguese

## Quick Start

### Installation

```bash
npm install --save-dev dlest
```

### Initialize Project

```bash
npx dlest init
```

This creates:
- `dlest.config.js` - Configuration file
- `tests/example.test.js` - Example test file
- `test-page.html` - Sample HTML page for testing

### Run Tests

```bash
# Test local development
npx dlest

# Test with local server
npx dlest --serve

# Test remote URL (NEW!)
npx dlest https://staging.example.com

# Test with authentication
npx dlest https://staging.example.com --auth-user=admin --auth-pass=senha

# Verbose mode for debugging
npx dlest --verbose

# CI mode for pipelines
npx dlest https://production.example.com --ci
```

## 📚 Documentation

**Complete documentation is available at: [metricasboss.github.io/dlest](https://metricasboss.github.io/dlest/)**

- **[Getting Started](https://metricasboss.github.io/dlest/getting-started/installation)** - Installation and setup guide
- **[Writing Tests](https://metricasboss.github.io/dlest/guides/writing-tests)** - Complete guide to writing analytics tests
- **[API Reference](https://metricasboss.github.io/dlest/api/matchers)** - All available matchers and APIs
- **[Remote Testing](https://metricasboss.github.io/dlest/guides/remote-testing)** - Test staging and production environments
- **[Cloud Export](docs/EXPORT.md)** - Export test results to S3/GCS for dashboards
- **[Network Validation](https://metricasboss.github.io/dlest/guides/network-validation)** - GA4 network request validation
- **[Examples](https://metricasboss.github.io/dlest/examples/ecommerce)** - Real-world usage examples

## Real-World Example

### Testing an E-commerce Purchase Flow

```javascript
// tests/purchase-flow.test.js
const { test, expect } = require('dlest');

test.describe('Purchase Flow', () => {
  test('complete purchase journey', async ({ page, dataLayer }) => {
    // 1. View product
    await page.goto('http://localhost:3000/products.html');
    await expect(dataLayer).toHaveEvent('view_item', {
      value: 99.99,
      currency: 'USD'
    });

    // 2. Add to cart
    await page.click('#add-to-cart');
    await expect(dataLayer).toHaveEvent('add_to_cart', {
      value: 99.99,
      items: expect.arrayContaining([
        expect.objectContaining({
          item_id: 'prod-123',
          quantity: 1
        })
      ])
    });

    // 3. Complete purchase
    await page.click('#checkout');
    await page.waitForTimeout(1000); // Wait for async purchase
    
    await expect(dataLayer).toHaveEvent('purchase', {
      transaction_id: expect.any(String),
      value: 99.99,
      currency: 'USD'
    });

    // 4. Verify the complete sequence
    await expect(dataLayer).toHaveEventSequence([
      'view_item',
      'add_to_cart',
      'purchase'
    ]);
  });
});
```

## Writing Tests

DLest uses familiar Jest-like syntax:

```javascript
const { test, expect } = require('dlest');

test('page view tracking', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000');
  
  await expect(dataLayer).toHaveEvent('page_view');
});

test('purchase tracking', async ({ page, dataLayer }) => {
  await page.goto('/product/123');
  await page.click('#add-to-cart');
  await page.click('#checkout');
  
  await expect(dataLayer).toHaveEvent('purchase', {
    transaction_id: expect.any(String),
    value: expect.any(Number),
    currency: 'BRL'
  });
});
```

## Remote Testing (NEW!)

Test analytics on staging or production environments:

```javascript
// Test remote URL directly
npx dlest https://staging.mysite.com

// With authentication
npx dlest https://staging.mysite.com --auth-user=admin --auth-pass=senha

// Use environment variables
export DLEST_BASE_URL=https://staging.mysite.com
export DLEST_AUTH_USER=admin
export DLEST_AUTH_PASS=senha
npx dlest

// Custom test file for remote
npx dlest https://production.mysite.com --test=tests/production.test.js

// CI/CD Pipeline
npx dlest $STAGING_URL --ci
```

### Verbose Mode

Debug with detailed event information:

```bash
npx dlest --verbose
```

Shows:
- All captured events with full data
- Expected vs found comparison
- DataLayer structure analysis
- Helpful error messages in Portuguese

## Cloud Export (NEW!)

Export test results to cloud storage for dashboards and analytics:

```bash
# Install provider SDK
npm install --save-optional @aws-sdk/client-s3

# Configure via environment variables
export DLEST_EXPORT_ENABLED=true
export DLEST_EXPORT_PROVIDER=s3
export DLEST_EXPORT_S3_BUCKET=my-dlest-results
export DLEST_EXPORT_S3_ACCESS_KEY_ID=AKIA...
export DLEST_EXPORT_S3_SECRET_ACCESS_KEY=...

# Run tests - results are automatically exported
npx dlest
```

### Features

- ☁️ **AWS S3 & Google Cloud Storage** - Support for major cloud providers
- 📊 **JSONL Format** - One line per test, easy to query with BigQuery/Athena
- 🔐 **Secure** - Warnings for hardcoded credentials, strip sensitive data
- 🔄 **Retry Logic** - Exponential backoff for network issues
- 💾 **Local Fallback** - Saves locally if upload fails
- 🎯 **Rich Metadata** - Includes git info, CI environment, system details
- 📁 **File Patterns** - Customizable naming with tokens (`{date}`, `{branch}`, etc)

### Exported Data

Each JSONL file contains:
```jsonl
{"type":"run_metadata","runId":"20240127120000-abc123","git":{...},"ci":{...}}
{"type":"test","runId":"...","suite":"Purchase","name":"complete flow","status":"passed","duration":1234,"dataLayerEvents":[...]}
{"type":"run_summary","runId":"...","stats":{"total":10,"passed":8,"failed":2}}
```

### Use Cases

- 📈 **Track Test Health** - Monitor pass/fail rates over time
- 🔍 **Debug Production Issues** - Compare expected vs actual events
- 📊 **Build Dashboards** - Visualize test results in Tableau/Metabase
- 🚨 **Setup Alerts** - Get notified when tests fail in CI/CD
- 📉 **Performance Analysis** - Track test duration trends

**Full documentation:** [docs/EXPORT.md](docs/EXPORT.md)

## Custom Matchers

DLest provides specialized matchers for data layer testing:

- `await expect(dataLayer).toHaveEvent(eventName, eventData?)` - Check if event exists
- `await expect(dataLayer).toHaveEventData(eventData)` - Check if any event contains specific data
- `await expect(dataLayer).toHaveEventCount(eventName, count)` - Verify event count
- `await expect(dataLayer).toHaveEventSequence(eventNames[])` - Validate event sequence

```javascript
// Event existence
await expect(dataLayer).toHaveEvent('purchase');

// Event with specific data
await expect(dataLayer).toHaveEvent('purchase', { value: 99.90 });

// Event count
await expect(dataLayer).toHaveEventCount('page_view', 1);

// Event sequence
await expect(dataLayer).toHaveEventSequence(['page_view', 'add_to_cart', 'purchase']);

// Negation
await expect(dataLayer).not.toHaveEvent('error');
```

## Configuration

Create a `dlest.config.js` file in your project root:

```javascript
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
    variableName: 'dataLayer', // Custom variable name
    waitTimeout: 5000,         // Event wait timeout
  }
};
```

## CLI Commands

```bash
# Start development server
npx dlest serve
npx dlest serve --port 8080        # Custom port
npx dlest serve --root ./dist      # Custom root directory

# Run all tests
npx dlest

# Run tests with auto-server (recommended)
npx dlest --serve
npx dlest --serve --serve-port 8080

# Run specific test file
npx dlest tests/purchase.test.js

# Use different browser
npx dlest --browser=firefox

# Run with visible browser (non-headless)
npx dlest --no-headless

# Initialize project
npx dlest init

# Initialize with e-commerce template
npx dlest init --template=ecommerce

# Install Playwright browsers
npx dlest install

# NPM Scripts (alternative to npx commands)
npm test              # Run tests
npm run test:serve    # Run tests with auto-server
npm run serve         # Start development server
npm run serve:dev     # Start server with verbose logging
```

## Development Server

DLest includes a built-in static file server for development:

```bash
# Start server on default port (3000)
npx dlest serve

# Custom port
npx dlest serve --port 8080

# Custom root directory  
npx dlest serve --root ./dist

# Custom host (for network access)
npx dlest serve --host 0.0.0.0

# Verbose logging
npx dlest serve --verbose
```

The server provides:
- ✅ Static file serving with proper MIME types
- ✅ Directory listings for folders without index.html
- ✅ SPA support (serves index.html for routes)
- ✅ CORS headers for development
- ✅ Automatic port detection if default is busy
- ✅ Graceful shutdown with Ctrl+C

## Templates

DLest comes with pre-built templates:

### Basic Template
```bash
npx dlest init --template=basic
```

Includes tests for:
- Page view tracking
- Button click tracking  
- Form submission tracking

### E-commerce Template
```bash
npx dlest init --template=ecommerce
```

Includes tests for:
- Product view tracking
- Add to cart events
- Purchase completion
- Complete funnel sequences

## Jest-like Features

DLest supports familiar Jest patterns:

```javascript
// Test suites
test.describe('E-commerce Flow', () => {
  test('product view', async ({ page, dataLayer }) => {
    // Test implementation
  });
});

// Expect helpers
expect.any(String)
expect.arrayContaining([...])
expect.objectContaining({...})

// Hooks (planned for future releases)
beforeEach(({ page, dataLayer }) => {
  // Setup
});
```

## Problem Statement

Analytics tracking breaks frequently due to:
- Frontend changes removing tracking elements
- Refactoring that changes event parameters
- A/B tests breaking conversion tracking
- Missing events from JavaScript errors
- No systematic testing of analytics code

DLest solves this by enabling automated testing of your data layer implementation.

## Browser Support

- ✅ Chromium (Chrome, Edge)
- ✅ Firefox
- ✅ WebKit (Safari)

## Requirements

- Node.js 16+
- Modern browsers via Playwright

## Troubleshooting

### Common Issues

**Tests timing out?**
- Increase timeout in config: `timeout: 60000`
- Check if your server is running: `npx dlest serve`

**Events not being captured?**
- Verify dataLayer variable name in config
- Check browser console for JavaScript errors
- Use `--no-headless` to debug visually

**Port already in use?**
- DLest will automatically find an available port
- Or specify a different port: `npx dlest serve --port 8080`

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development

```bash
# Clone the repo
git clone https://github.com/metricasboss/dlest.git
cd dlest

# Install dependencies
npm install

# Run tests
npm test

# Start development
npm run dev
```

## Support

- 📚 [Documentation](https://metricasboss.github.io/dlest/)
- 🐛 [Issue Tracker](https://github.com/metricasboss/dlest/issues)
- 💬 [Discussions](https://github.com/metricasboss/dlest/discussions)
- 📦 [npm Package](https://www.npmjs.com/package/dlest)

## License

MIT © [MetricasBoss](https://github.com/metricasboss)