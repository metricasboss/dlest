# Writing Tests

Learn best practices for writing effective analytics tests with DLest.

## Test Structure

DLest uses a Jest-like API that should feel familiar:

```javascript
const { test, expect } = require('dlest');

test('descriptive test name', async ({ page, dataLayer }) => {
  // Your test code here
});
```

## Test Suites

Group related tests with `test.describe`:

```javascript
test.describe('E-commerce Flow', () => {
  test('product view tracking', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/product/123');
    await expect(dataLayer).toHaveEvent('view_item');
  });

  test('add to cart tracking', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/product/123');
    await page.click('#add-to-cart');
    await expect(dataLayer).toHaveEvent('add_to_cart');
  });

  test('purchase tracking', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/product/123');
    await page.click('#add-to-cart');
    await page.click('#checkout');

    await expect(dataLayer).toHaveEvent('purchase', {
      transaction_id: expect.any(String),
      value: expect.any(Number)
    });
  });
});
```

## Test Context

Every test receives a context object with fixtures:

### Page - Browser Control

```javascript
test('example', async ({ page }) => {
  // Navigate
  await page.goto('https://example.com');

  // Interact with elements
  await page.click('#button');
  await page.fill('#email', 'test@example.com');

  // Wait for elements
  await page.waitForSelector('.product');

  // Type text
  await page.type('#search', 'laptop');

  // Press keys
  await page.press('#input', 'Enter');

  // Take screenshot
  await page.screenshot({ path: 'screenshot.png' });
});
```

[Full Playwright Page API →](https://playwright.dev/docs/api/class-page)

### DataLayer - Analytics Events

```javascript
test('example', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000');

  // Check event exists
  await expect(dataLayer).toHaveEvent('page_view');

  // Check with specific data
  await expect(dataLayer).toHaveEvent('purchase', {
    value: 99.99,
    currency: 'USD'
  });

  // Count events
  await expect(dataLayer).toHaveEventCount('page_view', 1);

  // Verify sequence
  await expect(dataLayer).toHaveEventSequence([
    'page_view',
    'add_to_cart',
    'purchase'
  ]);
});
```

[All matchers →](/api/matchers)

### Network - HTTP Requests

```javascript
test('example', async ({ page, network }) => {
  await page.goto('http://localhost:3000');

  // Validate GA4 request
  await expect(network).toHaveGA4Event('purchase');

  // Get all GA4 events
  const events = network.getGA4Events();

  // Get events by name
  const purchases = network.getGA4EventsByName('purchase');
});
```

[Network validation guide →](/guides/network-validation)

## Jest Matchers

DLest supports Jest's powerful expect helpers:

```javascript
test('flexible matching', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000');

  await expect(dataLayer).toHaveEvent('purchase', {
    // Match any string
    transaction_id: expect.any(String),

    // Match any number
    value: expect.any(Number),

    // Exact value
    currency: 'USD',

    // String containing
    description: expect.stringContaining('discount'),

    // String matching regex
    coupon_code: expect.stringMatching(/^SAVE[0-9]+$/),

    // Array containing items
    items: expect.arrayContaining([
      expect.objectContaining({
        item_id: 'prod-123',
        quantity: 1
      })
    ]),

    // Partial object match
    user: expect.objectContaining({
      id: '12345'
    })
  });
});
```

## Common Patterns

### Testing Async Events

Some events fire after async operations:

```javascript
test('async purchase event', async ({ page, dataLayer }) => {
  await page.click('#checkout');

  // Option 1: Wait for specific time
  await page.waitForTimeout(2000);

  // Option 2: Wait for UI element
  await page.waitForSelector('.success-message');

  // Option 3: Wait for network idle
  await page.waitForLoadState('networkidle');

  await expect(dataLayer).toHaveEvent('purchase');
});
```

### Testing SPAs (Single Page Apps)

For client-side routing:

```javascript
test('SPA navigation tracking', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000');

  // First page view
  await expect(dataLayer).toHaveEvent('page_view', {
    page_path: '/'
  });

  // Navigate via client-side routing
  await page.click('a[href="/products"]');

  // Wait for route change
  await page.waitForURL('**/products');

  // Second page view
  await expect(dataLayer).toHaveEventCount('page_view', 2);
  await expect(dataLayer).toHaveEvent('page_view', {
    page_path: '/products'
  });
});
```

### Testing Forms

```javascript
test('form submission tracking', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000/contact');

  // Fill form fields
  await page.fill('#name', 'John Doe');
  await page.fill('#email', 'john@example.com');
  await page.selectOption('#category', 'sales');
  await page.fill('#message', 'Hello world');

  // Submit
  await page.click('#submit');

  // Validate tracking
  await expect(dataLayer).toHaveEvent('form_submit', {
    form_name: 'contact',
    form_destination: 'sales'
  });
});
```

### Testing E-commerce Flows

```javascript
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
  await page.waitForTimeout(1000);

  await expect(dataLayer).toHaveEvent('purchase', {
    transaction_id: expect.any(String),
    value: 99.99,
    currency: 'USD'
  });

  // 4. Verify complete sequence
  await expect(dataLayer).toHaveEventSequence([
    'view_item',
    'add_to_cart',
    'purchase'
  ]);
});
```

### Testing Error Scenarios

```javascript
test('track 404 page', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000/nonexistent-page');

  await expect(dataLayer).toHaveEvent('page_view', {
    page_path: '/nonexistent-page',
    error_type: '404'
  });
});

test('track form validation error', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000/contact');
  await page.click('#submit'); // Submit empty form

  await expect(dataLayer).toHaveEvent('form_error', {
    form_name: 'contact',
    error_message: expect.stringContaining('required')
  });
});
```

## Best Practices

### 1. Use Descriptive Test Names

```javascript
// ❌ Bad
test('test 1', async ({ page, dataLayer }) => {});

// ✅ Good
test('purchase event fires with correct transaction_id and value', async ({ page, dataLayer }) => {});
```

### 2. Test One Thing at a Time

```javascript
// ❌ Bad - testing multiple things
test('all tracking works', async ({ page, dataLayer }) => {
  // Tests 10 different events
});

// ✅ Good - focused tests
test('page view event fires on homepage', async ({ page, dataLayer }) => {
  // ...
});

test('add to cart event fires with correct product data', async ({ page, dataLayer }) => {
  // ...
});
```

### 3. Keep Tests Independent

```javascript
// ❌ Bad - tests depend on each other
let productId;

test('create product', async () => {
  productId = '123'; // Modifies shared state
});

test('view product', async ({ page }) => {
  await page.goto(`/product/${productId}`); // Depends on previous test
});

// ✅ Good - tests are independent
test('view product tracking', async ({ page, dataLayer }) => {
  const productId = '123'; // Defined locally
  await page.goto(`/product/${productId}`);
  await expect(dataLayer).toHaveEvent('view_item');
});
```

### 4. Use Setup Helpers

```javascript
// Create helper functions for common setups
async function addProductToCart(page, productId) {
  await page.goto(`http://localhost:3000/product/${productId}`);
  await page.click('#add-to-cart');
}

test('checkout from cart', async ({ page, dataLayer }) => {
  await addProductToCart(page, '123');

  await page.click('#checkout');
  await expect(dataLayer).toHaveEvent('begin_checkout');
});

test('purchase from cart', async ({ page, dataLayer }) => {
  await addProductToCart(page, '123');

  await page.click('#checkout');
  await expect(dataLayer).toHaveEvent('purchase');
});
```

### 5. Handle Timing Issues

```javascript
test('event fires after animation', async ({ page, dataLayer }) => {
  await page.click('#animated-button');

  // Wait for animation to complete
  await page.waitForTimeout(500);

  await expect(dataLayer).toHaveEvent('button_click');
});

test('event fires after API call', async ({ page, dataLayer }) => {
  await page.click('#submit');

  // Wait for network to be idle
  await page.waitForLoadState('networkidle');

  await expect(dataLayer).toHaveEvent('form_submit');
});
```

## Debugging Tests

### Verbose Output

```bash
npx dlest --verbose
```

Shows:
- All captured dataLayer events
- Full event data
- Expected vs actual comparison

### Visual Debugging

```bash
npx dlest --no-headless
```

Opens a visible browser window so you can see what's happening.

### Screenshots

```javascript
test('debug with screenshot', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000');

  // Take screenshot at specific point
  await page.screenshot({ path: 'debug.png' });

  await expect(dataLayer).toHaveEvent('page_view');
});
```

### Console Logs

```javascript
test('debug with console', async ({ page, dataLayer }) => {
  // Listen to browser console
  page.on('console', msg => console.log('Browser:', msg.text()));

  await page.goto('http://localhost:3000');
  await expect(dataLayer).toHaveEvent('page_view');
});
```

## Next Steps

- Learn about [available matchers](/api/matchers)
- See [real-world examples](/examples/ecommerce)
- Set up [remote testing](/guides/remote-testing)
- Configure [network validation](/guides/network-validation)
