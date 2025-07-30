# DLest

[![npm version](https://badge.fury.io/js/dlest.svg)](https://www.npmjs.com/package/dlest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/dlest.svg)](https://nodejs.org)

**Jest for your data layer** - A test runner specifically designed for testing analytics tracking implementations.

DLest provides familiar Jest-like syntax for validating data layer events in web applications. Built on top of Playwright, it allows developers to write unit tests for their analytics implementations and catch tracking bugs before they reach production.

## Why DLest?

- 🧪 **Jest-like API** - Familiar syntax for JavaScript developers
- 🎯 **Purpose-built** - Designed specifically for analytics testing
- 🚀 **Fast & Reliable** - Built on Playwright for real browser testing
- 📦 **Zero Config** - Works out of the box with sensible defaults
- 🔧 **Extensible** - Custom matchers and templates for your needs
- 🌐 **Built-in Server** - No need for Python or external tools

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
# Option 1: Start server and run tests automatically
npx dlest --serve

# Option 2: Manual server + tests  
npx dlest serve        # Start server in one terminal
npx dlest              # Run tests in another terminal
```

## Real-World Example

### Testing an E-commerce Purchase Flow

```javascript
// tests/purchase-flow.test.js
const { test, expect } = require('dlest');

test.describe('Purchase Flow', () => {
  test('complete purchase journey', async ({ page, dataLayer }) => {
    // 1. View product
    await page.goto('http://localhost:3000/products.html');
    expect(dataLayer).toHaveEvent('view_item', {
      value: 99.99,
      currency: 'USD'
    });

    // 2. Add to cart
    await page.click('#add-to-cart');
    expect(dataLayer).toHaveEvent('add_to_cart', {
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
    
    expect(dataLayer).toHaveEvent('purchase', {
      transaction_id: expect.any(String),
      value: 99.99,
      currency: 'USD'
    });

    // 4. Verify the complete sequence
    expect(dataLayer).toHaveEventSequence([
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
  
  expect(dataLayer).toHaveEvent('page_view');
});

test('purchase tracking', async ({ page, dataLayer }) => {
  await page.goto('/product/123');
  await page.click('#add-to-cart');
  await page.click('#checkout');
  
  expect(dataLayer).toHaveEvent('purchase', {
    transaction_id: expect.any(String),
    value: expect.any(Number),
    currency: 'BRL'
  });
});
```

## Custom Matchers

DLest provides specialized matchers for data layer testing:

- `toHaveEvent(eventName, eventData?)` - Check if event exists
- `toHaveEventData(eventData)` - Check if any event contains specific data
- `toHaveEventCount(eventName, count)` - Verify event count
- `toHaveEventSequence(eventNames[])` - Validate event sequence

```javascript
// Event existence
expect(dataLayer).toHaveEvent('purchase');

// Event with specific data
expect(dataLayer).toHaveEvent('purchase', { value: 99.90 });

// Event count
expect(dataLayer).toHaveEventCount('page_view', 1);

// Event sequence
expect(dataLayer).toHaveEventSequence(['page_view', 'add_to_cart', 'purchase']);

// Negation
expect(dataLayer).not.toHaveEvent('error');
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

- 📚 [Documentation](https://github.com/metricasboss/dlest#readme)
- 🐛 [Issue Tracker](https://github.com/metricasboss/dlest/issues)
- 💬 [Discussions](https://github.com/metricasboss/dlest/discussions)

## License

MIT © [MetricasBoss](https://github.com/metricasboss)