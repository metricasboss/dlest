# Matchers

DLest provides custom matchers specifically designed for analytics testing, plus common Jest-like matchers for general assertions.

## Analytics Matchers

### `toHaveEvent(eventName, eventData?)`

Check if a specific event exists in the dataLayer, optionally with specific data.

```javascript
// Check event exists
await expect(dataLayer).toHaveEvent('page_view');

// Check event with exact data
await expect(dataLayer).toHaveEvent('purchase', {
  value: 99.99,
  currency: 'USD'
});

// Check event with flexible matching
await expect(dataLayer).toHaveEvent('purchase', {
  transaction_id: expect.any(String),
  value: expect.any(Number),
  currency: 'USD',
  items: expect.arrayContaining([
    expect.objectContaining({
      item_id: 'prod-123'
    })
  ])
});

// Negation
await expect(dataLayer).not.toHaveEvent('error');
```

**Parameters:**
- `eventName` (string): Name of the event to find
- `eventData` (object, optional): Expected event data (uses deep equality)

### `toHaveEventData(eventData)`

Check if any event in the dataLayer contains specific data.

```javascript
// Find event with specific data
await expect(dataLayer).toHaveEventData({
  category: 'electronics',
  value: 99.99
});

// With flexible matching
await expect(dataLayer).toHaveEventData({
  user_id: expect.any(String),
  timestamp: expect.any(Number)
});
```

**Parameters:**
- `eventData` (object): Data to search for in any event

### `toHaveEventCount(eventName, count)`

Verify the exact number of times an event occurred.

```javascript
// Expect exactly 1 page view
await expect(dataLayer).toHaveEventCount('page_view', 1);

// Expect 3 button clicks
await expect(dataLayer).toHaveEventCount('button_click', 3);

// Expect 0 errors
await expect(dataLayer).toHaveEventCount('error', 0);
```

**Parameters:**
- `eventName` (string): Name of the event to count
- `count` (number): Expected number of occurrences

**Use cases:**
- Verify page views in SPAs
- Count user interactions
- Ensure no duplicate events
- Validate error tracking

### `toHaveEventSequence(eventNames)`

Validate that events occurred in a specific order.

```javascript
// Verify purchase funnel
await expect(dataLayer).toHaveEventSequence([
  'view_item',
  'add_to_cart',
  'begin_checkout',
  'purchase'
]);

// Verify navigation flow
await expect(dataLayer).toHaveEventSequence([
  'page_view',
  'scroll',
  'form_start',
  'form_submit'
]);
```

**Parameters:**
- `eventNames` (string[]): Array of event names in expected order

**Important:** The matcher looks for the exact sequence in order. Other events can occur before, after, or between the sequence events.

### `toHaveGA4Event(eventName, eventData?)`

Validate that a Google Analytics 4 network request was sent with the correct event.

```javascript
// Check GA4 event was sent
await expect(network).toHaveGA4Event('purchase');

// Check with specific parameters
await expect(network).toHaveGA4Event('purchase', {
  transaction_id: expect.any(String),
  value: expect.any(Number),
  currency: 'USD'
});
```

**Parameters:**
- `eventName` (string): GA4 event name
- `eventData` (object, optional): Expected event parameters

**Note:** Requires the `network` fixture. See [Network Validation](/docs/guides/network-validation).

## General Matchers

DLest includes Jest-compatible matchers for general assertions.

### Type Checking

#### `toBeDefined()`

Check if value is defined (not `undefined` or `null`).

```javascript
const events = await dataLayer.getEvents();
expect(events).toBeDefined();
```

#### `toBeUndefined()`

Check if value is `undefined`.

```javascript
const missingEvent = events.find(e => e.event === 'nonexistent');
expect(missingEvent).toBeUndefined();
```

#### `toBeTruthy()`

Check if value is truthy.

```javascript
const hasEvents = events.length > 0;
expect(hasEvents).toBeTruthy();
```

#### `toBeFalsy()`

Check if value is falsy.

```javascript
const isEmpty = events.length === 0;
expect(isEmpty).toBeFalsy();
```

### Equality

#### `toBe(expected)`

Strict equality using `Object.is()`.

```javascript
expect(event.currency).toBe('USD');
expect(event.value).toBe(99.99);
expect(event.items.length).toBe(1);
```

**Best for:** Primitives (string, number, boolean, null, undefined)

### Numeric Comparisons

#### `toBeGreaterThan(expected)`

Check if number is greater than expected.

```javascript
expect(purchaseEvent.value).toBeGreaterThan(0);
expect(events.length).toBeGreaterThan(5);
```

#### `toBeLessThan(expected)`

Check if number is less than expected.

```javascript
expect(event.price).toBeLessThan(1000);
expect(loadTime).toBeLessThan(3000);
```

### Collections

#### `toHaveLength(expected)`

Check array or string length.

```javascript
const events = await dataLayer.getEvents();
expect(events).toHaveLength(3);

expect(event.name).toHaveLength(10);
```

#### `toContain(expected)`

Check if array or string contains a value.

```javascript
const eventNames = events.map(e => e.event);
expect(eventNames).toContain('purchase');

expect(event.description).toContain('special offer');
```

#### `toHaveProperty(property, value?)`

Check if object has a property, optionally with specific value.

```javascript
expect(purchaseEvent).toHaveProperty('transaction_id');
expect(purchaseEvent).toHaveProperty('currency', 'USD');
expect(purchaseEvent).toHaveProperty('items');
```

### Strings

#### `toMatch(expected)`

Check if string matches pattern (string or regex).

```javascript
// With string (substring match)
expect(event.transaction_id).toMatch('TXN-');

// With regex
expect(event.coupon_code).toMatch(/^SAVE[0-9]+$/);
expect(event.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
```

### Functions

#### `toThrow(expected?)`

Check if function throws an error.

```javascript
// Expects any error
expect(() => {
  throw new Error('oops');
}).toThrow();

// Expects specific error message
expect(() => {
  throw new Error('Invalid event');
}).toThrow('Invalid event');

// Expects error matching regex
expect(() => {
  throw new Error('Invalid event name');
}).toThrow(/Invalid event/);

// Expects specific error type
expect(() => {
  throw new TypeError('Bad type');
}).toThrow(TypeError);
```

## Jest Helpers

DLest supports Jest's `expect` helpers for flexible matching.

### `expect.any(Type)`

Match any value of a specific type.

```javascript
await expect(dataLayer).toHaveEvent('purchase', {
  transaction_id: expect.any(String),
  value: expect.any(Number),
  items: expect.any(Array)
});
```

**Supported types:** String, Number, Boolean, Array, Object, Function

### `expect.objectContaining(object)`

Partial object matching (subset of properties).

```javascript
await expect(dataLayer).toHaveEvent('purchase', {
  user: expect.objectContaining({
    id: '12345'
    // Other properties don't matter
  })
});
```

### `expect.arrayContaining(array)`

Check if array contains specific items (order doesn't matter).

```javascript
await expect(dataLayer).toHaveEvent('purchase', {
  items: expect.arrayContaining([
    expect.objectContaining({
      item_id: 'prod-123'
    }),
    expect.objectContaining({
      item_id: 'prod-456'
    })
  ])
});
```

### `expect.stringContaining(string)`

Check if string contains substring.

```javascript
await expect(dataLayer).toHaveEvent('form_error', {
  error_message: expect.stringContaining('required')
});
```

### `expect.stringMatching(regex)`

Check if string matches regex pattern.

```javascript
await expect(dataLayer).toHaveEvent('purchase', {
  transaction_id: expect.stringMatching(/^TXN-[A-Z0-9]+$/),
  email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
});
```

## Negation

All matchers support negation with `.not`:

```javascript
// Event should not exist
await expect(dataLayer).not.toHaveEvent('error');

// Event count should not be zero
await expect(dataLayer).not.toHaveEventCount('page_view', 0);

// Value should not be zero
expect(purchaseEvent.value).not.toBe(0);

// String should not contain word
expect(event.description).not.toContain('discontinued');
```

## Common Patterns

### E-commerce Purchase

```javascript
await expect(dataLayer).toHaveEvent('purchase', {
  transaction_id: expect.any(String),
  value: expect.any(Number),
  currency: 'USD',
  items: expect.arrayContaining([
    expect.objectContaining({
      item_id: expect.any(String),
      item_name: expect.any(String),
      price: expect.any(Number),
      quantity: expect.any(Number)
    })
  ]),
  user: expect.objectContaining({
    id: expect.any(String)
  })
});
```

### Form Validation

```javascript
await expect(dataLayer).toHaveEvent('form_submit', {
  form_name: 'contact',
  form_destination: 'sales',
  timestamp: expect.any(Number)
});

// Verify no errors
await expect(dataLayer).not.toHaveEvent('form_error');
```

### User Journey

```javascript
// Verify complete sequence
await expect(dataLayer).toHaveEventSequence([
  'page_view',
  'view_item',
  'add_to_cart',
  'begin_checkout',
  'add_payment_info',
  'purchase'
]);

// Verify counts
await expect(dataLayer).toHaveEventCount('page_view', 3);
await expect(dataLayer).toHaveEventCount('add_to_cart', 2);
await expect(dataLayer).toHaveEventCount('purchase', 1);
```

## Tips

1. **Use `expect.any()` for dynamic values** like timestamps, IDs, or generated strings
2. **Use `expect.objectContaining()` to match partial objects** - don't force exact matches
3. **Use `expect.arrayContaining()` for arrays** where order doesn't matter
4. **Test sequences** to validate complete user flows
5. **Use negation** to verify events that shouldn't happen
6. **Combine matchers** for powerful, flexible assertions

## Next Steps

- See [real-world examples](/docs/examples/ecommerce)
- Learn about [test fixtures](/docs/api/fixtures)
- Explore [network validation](/docs/guides/network-validation)
- Read the [Test API reference](/docs/api/test-api)
