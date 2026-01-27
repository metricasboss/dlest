# Network Request Validation

DLest can intercept and validate actual network requests to analytics platforms, ensuring your implementation sends correct data before it reaches production.

## Features

### GA4 Network Validation

DLest intercepts requests to Google Analytics 4 and validates:

- **Event names**: Must be ≤40 characters, start with letter, alphanumeric + underscore only
- **Parameter limits**: Max 25 custom parameters per event
- **Parameter names**: Must be ≤40 characters
- **Parameter values**: String values must be ≤100 characters (≤500 for page_location, page_referrer, page_title)
- **User properties**: Max 25 user properties
- **Item parameters**: Max 10 custom parameters per item
- **Reserved parameters**: Warns when using Google's reserved parameter names
- **Measurement ID format**: Validates G-XXXXXXXXXX format

### Universal Analytics Deprecation Detection

Automatically detects and flags Universal Analytics (UA) implementations as errors since UA was discontinued on July 1, 2023:

- Detects UA measurement IDs (UA-XXXXXX-X)
- Identifies legacy /j/collect endpoints
- Provides migration guidance to GA4

## Usage

### Basic Network Validation

```javascript
test('validate GA4 implementation', async ({ page, network }) => {
  await page.goto('https://example.com');

  // Check that event was sent
  await expect(network).toHaveGA4Event('purchase');

  // Get events for detailed validation
  const events = network.getGA4Events();
  const purchaseEvents = network.getGA4EventsByName('purchase');
});
```

### Using the GA4 Validator

```javascript
const GA4Validator = require('dlest/validators/ga4-validator');
const validator = new GA4Validator({ checkReserved: true });

test('validate GA4 limits', async ({ page, network }) => {
  await page.goto('https://example.com');

  const events = network.getGA4Events();

  events.forEach(event => {
    const validation = validator.validateHit(event);

    if (!validation.valid) {
      console.log('Errors:', validation.errors);
      console.log('Warnings:', validation.warnings);
    }
  });
});
```

### Network Spy API

```javascript
// Get all GA4 events
const events = network.getGA4Events();

// Get events by name
const purchases = network.getGA4EventsByName('purchase');

// Clear captured events
network.clear();

// Print debug information
network.printDebug();
```

## Configuration

### Verbose Output

Control the verbosity of network validation output:

```bash
# Verbose output with --verbose flag
npx dlest --verbose

# Or use environment variable
DLEST_VERBOSE=true npx dlest
```

### Headless Mode

Control browser visibility:

```bash
# Show browser (useful for debugging)
npx dlest --no-headless

# Or in config file
module.exports = {
  headless: false
};
```

## Common Validation Errors

| Error Type | Description | Solution |
|------------|-------------|----------|
| `INVALID_EVENT_NAME` | Event name > 40 chars or invalid format | Shorten name, use only letters, numbers, underscores |
| `TOO_MANY_PARAMETERS` | More than 25 custom parameters | Reduce parameters or use user properties |
| `INVALID_PARAMETER_NAME` | Parameter name > 40 chars | Shorten parameter name |
| `INVALID_STRING_VALUE` | String value exceeds limit | Truncate to 100 chars (500 for page_* params) |
| `DEPRECATED_UNIVERSAL_ANALYTICS` | Using discontinued UA | Migrate to GA4 immediately |
| `RESERVED_PARAMETER` | Using Google reserved name | Rename parameter to avoid conflicts |

## Examples

### Complete E-commerce Validation

```javascript
test('validate complete purchase flow', async ({ page, dataLayer, network }) => {
  const validator = new GA4Validator();

  // Track all events during flow
  await page.goto('/products');
  await page.click('.product');
  await page.click('#add-to-cart');
  await page.click('#checkout');

  // Validate sequence
  const events = network.getGA4Events();
  const eventNames = events.map(e => e.eventName);

  expect(eventNames).toContain('view_item');
  expect(eventNames).toContain('add_to_cart');
  expect(eventNames).toContain('begin_checkout');
  expect(eventNames).toContain('purchase');

  // Validate each event
  let errors = [];
  events.forEach(event => {
    const validation = validator.validateHit(event);
    if (!validation.valid) {
      errors.push({
        event: event.eventName,
        errors: validation.errors
      });
    }
  });

  expect(errors).toEqual([]);
});
```

### Detect Implementation Issues

```javascript
test('detect common GA4 mistakes', async ({ page, network }) => {
  await page.goto('/');

  const validator = new GA4Validator({ checkReserved: true });
  const events = network.getGA4Events();

  const report = {
    deprecatedUA: 0,
    invalidEvents: 0,
    tooManyParams: 0,
    reservedParams: 0
  };

  events.forEach(event => {
    const validation = validator.validateHit(event);

    validation.errors.forEach(error => {
      switch(error.type) {
        case 'DEPRECATED_UNIVERSAL_ANALYTICS':
          report.deprecatedUA++;
          break;
        case 'INVALID_EVENT_NAME':
          report.invalidEvents++;
          break;
        case 'TOO_MANY_PARAMETERS':
          report.tooManyParams++;
          break;
      }
    });

    validation.warnings.forEach(warning => {
      if (warning.type === 'RESERVED_PARAMETER') {
        report.reservedParams++;
      }
    });
  });

  console.log('Implementation Issues:', report);

  // Fail if critical issues found
  expect(report.deprecatedUA).toBe(0);
  expect(report.invalidEvents).toBe(0);
});
```

## Migration from Universal Analytics

If DLest detects Universal Analytics (UA-XXXXXX-X), you'll see:

```
❌ DEPRECATED_UNIVERSAL_ANALYTICS
Universal Analytics (UA) was discontinued on July 1, 2023.
Migrate to Google Analytics 4 (GA4) immediately.
Migration guide: https://support.google.com/analytics/answer/11583528
```

### Next Steps:
1. Create a new GA4 property
2. Update your measurement ID from `UA-XXXXXX-X` to `G-XXXXXXXXXX`
3. Update event names and parameters to GA4 format
4. Test with DLest to ensure correct implementation