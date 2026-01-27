# Quick Start

Get up and running with DLest in less than 5 minutes.

## Initialize Your Project

Create the basic structure for your DLest tests:

```bash
npx dlest init
```

This command creates:
- `dlest.config.js` - Configuration file
- `tests/example.test.js` - Example test file
- `test-page.html` - Sample HTML page for testing

:::tip Template Options
You can initialize with different templates:

```bash
# E-commerce template with purchase flow tests
npx dlest init --template=ecommerce

# Basic template (default)
npx dlest init --template=basic
```
:::

## Run Your Tests

### Local Development

Test your local files:

```bash
npx dlest
```

This runs all test files matching `**/*.test.js` in your `tests/` directory.

### With Local Server

DLest includes a built-in development server:

```bash
npx dlest --serve
```

This automatically:
1. Starts a local server on port 3000
2. Runs your tests
3. Shuts down the server

### Test Remote URLs

Test staging or production environments:

```bash
# Test any URL directly
npx dlest https://staging.example.com

# With authentication
npx dlest https://staging.example.com --auth-user=admin --auth-pass=secret

# CI mode (no colors, machine-readable output)
npx dlest https://production.example.com --ci
```

## Your First Test

The `npx dlest init` command creates an example test. Let's look at it:

```javascript title="tests/example.test.js"
const { test, expect } = require('dlest');

test('page view tracking', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000');

  await expect(dataLayer).toHaveEvent('page_view');
});

test('button click tracking', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000');
  await page.click('#track-button');

  await expect(dataLayer).toHaveEvent('button_click', {
    button_name: 'Test Button'
  });
});
```

## Understanding the Output

When you run tests, you'll see output like:

```
✓ tests/example.test.js (2)
  ✓ page view tracking (245ms)
  ✓ button click tracking (312ms)

Tests: 2 passed, 2 total
Time:  0.87s
```

### Verbose Mode

For debugging, use verbose mode:

```bash
npx dlest --verbose
```

This shows:
- All captured dataLayer events
- Full event data for each event
- Expected vs actual comparison
- Helpful error messages in Portuguese

## Common Commands

```bash
# Run all tests
npx dlest

# Run with local server
npx dlest --serve

# Run specific test file
npx dlest tests/purchase.test.js

# Visible browser (non-headless)
npx dlest --no-headless

# Different browser
npx dlest --browser=firefox

# Verbose debugging
npx dlest --verbose
```

## NPM Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "dlest",
    "test:serve": "dlest --serve",
    "test:verbose": "dlest --verbose",
    "test:firefox": "dlest --browser=firefox"
  }
}
```

Then run:

```bash
npm test
npm run test:serve
npm run test:verbose
```

## Next Steps

Now that you have DLest running:

1. Learn how to [write effective tests](/getting-started/first-test)
2. Explore available [custom matchers](/api/matchers)
3. Check out [real-world examples](/examples/ecommerce)
4. Set up [remote testing](/guides/remote-testing) for your environments

## Troubleshooting

### Tests timeout

If tests are timing out, increase the timeout in your config:

```javascript title="dlest.config.js"
module.exports = {
  timeout: 60000, // 60 seconds
};
```

### Server port already in use

DLest automatically finds an available port. Or specify a custom port:

```bash
npx dlest --serve --serve-port 8080
```

### DataLayer events not captured

Make sure:
1. Your page loads correctly
2. The dataLayer variable name matches your config
3. Events are being pushed before test completes
4. JavaScript has no errors (check console)

Use `--no-headless --verbose` to debug:

```bash
npx dlest --no-headless --verbose
```
