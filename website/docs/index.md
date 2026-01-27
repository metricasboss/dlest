---
sidebar_position: 0
slug: /
---

# Welcome to DLest

**Jest for your data layer** - A test runner specifically designed for testing analytics tracking implementations.

## Quick Links

- **[Installation](/getting-started/installation)** - Get started in 5 minutes
- **[Quick Start](/getting-started/quick-start)** - Write your first test
- **[API Reference](/api/matchers)** - All available matchers
- **[Examples](/examples/ecommerce)** - Real-world examples

## What is DLest?

DLest provides familiar Jest-like syntax for validating data layer events in web applications. Built on top of Playwright, it allows developers to write unit tests for their analytics implementations and catch tracking bugs before they reach production.

```javascript
const { test, expect } = require('dlest');

test('purchase tracking works', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000/product');
  await page.click('#add-to-cart');
  await page.click('#checkout');

  await expect(dataLayer).toHaveEvent('purchase', {
    transaction_id: expect.any(String),
    value: 99.99,
    currency: 'USD'
  });
});
```

## Why DLest?

Analytics tracking breaks constantly due to:
- Frontend changes removing tracking elements
- Refactoring that changes event parameters
- A/B tests breaking conversion tracking
- Missing events from JavaScript errors
- No systematic testing of analytics code

DLest solves this by enabling automated testing of your data layer implementation.

## Get Started

Ready to start testing your analytics? Head over to the [Installation Guide](/getting-started/installation).
