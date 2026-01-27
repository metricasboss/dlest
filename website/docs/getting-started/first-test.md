# Your First Test

Learn the anatomy of a DLest test and write your first analytics test.

## Test Structure

A DLest test has three main parts:

```javascript
const { test, expect } = require('dlest');

// 1. Test definition
test('descriptive test name', async ({ page, dataLayer }) => {
  // 2. Browser interactions
  await page.goto('http://localhost:3000/product');
  await page.click('#add-to-cart');

  // 3. Assertions
  await expect(dataLayer).toHaveEvent('add_to_cart');
});
```

## Test Fixtures

DLest provides two main fixtures in every test:

### `page` - Browser Control

The `page` fixture is a Playwright Page object for browser automation:

```javascript
test('example', async ({ page }) => {
  // Navigate to a URL
  await page.goto('https://example.com');

  // Click elements
  await page.click('#button');

  // Fill forms
  await page.fill('#email', 'test@example.com');

  // Wait for elements
  await page.waitForSelector('.product');

  // Type text
  await page.type('#search', 'laptop');

  // Press keys
  await page.press('#input', 'Enter');
});
```

[See full Playwright Page API →](https://playwright.dev/docs/api/class-page)

### `dataLayer` - Analytics Tracking

The `dataLayer` fixture captures all analytics events:

```javascript
test('example', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000');

  // Check if event exists
  await expect(dataLayer).toHaveEvent('page_view');

  // Check event with specific data
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

[See all matchers →](/docs/api/matchers)

### `network` - Network Requests

The `network` fixture captures HTTP requests (useful for GA4/GTM validation):

```javascript
test('GA4 tracking', async ({ page, network }) => {
  await page.goto('http://localhost:3000');

  await expect(network).toHaveRequest({
    url: 'https://www.google-analytics.com/g/collect',
    params: {
      en: 'page_view', // Event name
      ep: expect.objectContaining({
        page_title: 'Home'
      })
    }
  });
});
```

[Learn more about network validation →](/docs/guides/network-validation)

## Writing Effective Tests

### 1. Use Descriptive Names

```javascript
// ❌ Bad - vague
test('test 1', async ({ page, dataLayer }) => {
  // ...
});

// ✅ Good - descriptive
test('purchase event fires with correct transaction data', async ({ page, dataLayer }) => {
  // ...
});
```

### 2. Test User Flows

Think about the user journey:

```javascript
test('complete checkout flow', async ({ page, dataLayer }) => {
  // 1. View product
  await page.goto('http://localhost:3000/product/123');
  await expect(dataLayer).toHaveEvent('view_item');

  // 2. Add to cart
  await page.click('#add-to-cart');
  await expect(dataLayer).toHaveEvent('add_to_cart');

  // 3. Go to cart
  await page.click('#view-cart');
  await expect(dataLayer).toHaveEvent('view_cart');

  // 4. Complete purchase
  await page.click('#checkout');
  await expect(dataLayer).toHaveEvent('purchase', {
    transaction_id: expect.any(String),
    value: expect.any(Number)
  });

  // 5. Verify sequence
  await expect(dataLayer).toHaveEventSequence([
    'view_item',
    'add_to_cart',
    'view_cart',
    'purchase'
  ]);
});
```

### 3. Use Jest Matchers

DLest supports Jest's expect helpers:

```javascript
test('flexible matching', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000');

  await expect(dataLayer).toHaveEvent('purchase', {
    // Any string
    transaction_id: expect.any(String),

    // Any number
    value: expect.any(Number),

    // Exact value
    currency: 'USD',

    // Array containing
    items: expect.arrayContaining([
      expect.objectContaining({
        item_id: 'prod-123'
      })
    ]),

    // Object containing (partial match)
    user: expect.objectContaining({
      id: '12345'
    })
  });
});
```

### 4. Handle Async Events

Some events fire after delays (API calls, animations):

```javascript
test('async purchase event', async ({ page, dataLayer }) => {
  await page.click('#checkout');

  // Wait for async operation
  await page.waitForTimeout(2000);

  // Or wait for specific element
  await page.waitForSelector('.success-message');

  await expect(dataLayer).toHaveEvent('purchase');
});
```

### 5. Group Related Tests

Use `test.describe` to organize tests:

```javascript
test.describe('Product Page Tracking', () => {
  test('view_item event fires on page load', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/product/123');
    await expect(dataLayer).toHaveEvent('view_item');
  });

  test('add_to_cart event fires on button click', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/product/123');
    await page.click('#add-to-cart');
    await expect(dataLayer).toHaveEvent('add_to_cart');
  });
});

test.describe('Checkout Flow', () => {
  test('begin_checkout event fires', async ({ page, dataLayer }) => {
    // ...
  });

  test('purchase event fires with correct data', async ({ page, dataLayer }) => {
    // ...
  });
});
```

## Common Patterns

### Testing Forms

```javascript
test('form submission tracking', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000/contact');

  await page.fill('#name', 'John Doe');
  await page.fill('#email', 'john@example.com');
  await page.fill('#message', 'Hello world');

  await page.click('#submit');

  await expect(dataLayer).toHaveEvent('form_submit', {
    form_name: 'contact',
    form_destination: 'sales'
  });
});
```

### Testing Navigation

```javascript
test('page navigation tracking', async ({ page, dataLayer }) => {
  // Homepage
  await page.goto('http://localhost:3000');
  await expect(dataLayer).toHaveEvent('page_view', {
    page_path: '/'
  });

  // Navigate to product
  await page.click('a[href="/products"]');
  await expect(dataLayer).toHaveEventCount('page_view', 2);
});
```

### Testing Clicks

```javascript
test('CTA button click tracking', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000');

  await page.click('#cta-button');

  await expect(dataLayer).toHaveEvent('click', {
    link_text: 'Get Started',
    link_url: '/signup'
  });
});
```

## Next Steps

Now that you understand test structure:

1. Learn about all [available matchers](/docs/api/matchers)
2. Explore [test templates](/docs/guides/templates) for common scenarios
3. See [real-world examples](/docs/examples/ecommerce)
4. Set up [debugging](/docs/guides/debugging) for troubleshooting

## Tips

- **Start simple**: Test one event at a time
- **Use verbose mode**: `--verbose` helps debug
- **Watch browser**: `--no-headless` shows what's happening
- **Check timing**: Add `waitForTimeout` if events are async
- **Group tests**: Use `describe` blocks for organization
- **Be specific**: Match exact data when possible
- **Test sequences**: Verify complete user flows
