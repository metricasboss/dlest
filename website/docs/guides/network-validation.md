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

Automatically detects and flags Universal Analytics (UA) implementations as errors since UA was discontinued on July 1, 2023.

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

## Common Validation Errors

| Error Type | Description | Solution |
|------------|-------------|----------|
| `INVALID_EVENT_NAME` | Event name > 40 chars or invalid format | Shorten name, use only letters, numbers, underscores |
| `TOO_MANY_PARAMETERS` | More than 25 custom parameters | Reduce parameters or use user properties |
| `INVALID_PARAMETER_NAME` | Parameter name > 40 chars | Shorten parameter name |
| `INVALID_STRING_VALUE` | String value exceeds limit | Truncate to 100 chars (500 for page_* params) |
| `DEPRECATED_UNIVERSAL_ANALYTICS` | Using discontinued UA | Migrate to GA4 immediately |

## Next Steps

- See [GA4 validation examples](/advanced/ga4-validation)
- Learn about [remote testing](/guides/remote-testing)
- Explore [debugging techniques](/guides/debugging)
