# Test API

DLest provides a Jest-like API for writing tests.

## Test Definition

```javascript
const { test, expect } = require('dlest');

test('test name', async ({ page, dataLayer }) => {
  // Test code
});
```

## Test Suites

Group related tests:

```javascript
test.describe('Suite name', () => {
  test('test 1', async ({ page, dataLayer }) => {
    // Test code
  });

  test('test 2', async ({ page, dataLayer }) => {
    // Test code
  });
});
```

## Test Context

Every test receives fixtures:
- `page` - Playwright Page for browser control
- `dataLayer` - DLest dataLayer proxy for assertions
- `network` - Network spy for GA4 validation

See [Fixtures](/docs/api/fixtures) for details.

## Next Steps

- Learn about [available matchers](/docs/api/matchers)
- Explore [test fixtures](/docs/api/fixtures)
- See [real-world examples](/docs/examples/ecommerce)
