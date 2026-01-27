/**
 * GA4 Network Validation Example
 *
 * Demonstrates how to validate GA4 implementation by intercepting
 * and validating actual network requests to Google Analytics
 */

test.describe('GA4 Network Validation', () => {

  test('validate GA4 pageview implementation', async ({ page, dataLayer, network }) => {
    // Navigate to page
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');

    // Check that GA4 pageview was sent
    await expect(network).toHaveGA4Event('page_view');

    // Validate specific pageview parameters
    const pageviews = network.getGA4EventsByName('page_view');
    expect(pageviews.length).toBe(1);

    const pageview = pageviews[0];
    expect(pageview.measurementId).toMatch(/^G-/);
    expect(pageview.clientId).toBeTruthy();
  });

  test('validate e-commerce purchase event', async ({ page, dataLayer, network }) => {
    // Navigate and complete purchase
    await page.goto('https://example.com/product');
    await page.click('#add-to-cart');
    await page.click('#checkout');

    // Validate purchase event was sent with correct parameters
    await expect(network).toHaveGA4Event('purchase', {
      transaction_id: expect.any(String),
      value: expect.any(Number),
      currency: expect.any(String),
      items: expect.arrayContaining([
        expect.objectContaining({
          item_id: expect.any(String),
          price: expect.any(Number)
        })
      ])
    });

    // Use GA4 validator to check for implementation errors
    const GA4Validator = require('../src/validators/ga4-validator');
    const validator = new GA4Validator();
    const purchaseEvents = network.getGA4EventsByName('purchase');

    purchaseEvents.forEach(event => {
      const validation = validator.validateHit(event);
      expect(validation.valid).toBe(true);

      if (!validation.valid) {
        console.log('GA4 Validation Errors:', validation.errors);
      }
    });
  });

  test('detect deprecated Universal Analytics', async ({ page, dataLayer, network }) => {
    // Navigate to page with UA implementation
    await page.goto('https://example.com/legacy');
    await page.waitForLoadState('networkidle');

    const GA4Validator = require('../src/validators/ga4-validator');
    const validator = new GA4Validator();
    const events = network.getGA4Events();

    events.forEach(event => {
      const validation = validator.validateHit(event);

      // Check for UA deprecation errors
      const hasUAError = validation.errors.some(error =>
        error.type === 'DEPRECATED_UNIVERSAL_ANALYTICS'
      );

      if (hasUAError) {
        console.log('⚠️ Universal Analytics detected - must migrate to GA4');
        console.log('UA was discontinued on July 1, 2023');
      }
    });
  });

  test('compare dataLayer vs network events', async ({ page, dataLayer, network }) => {
    await page.goto('https://example.com');

    // Trigger custom event
    await page.click('#cta-button');
    await page.waitForTimeout(1000);

    // Get events from both sources
    const dataLayerEvents = await dataLayer.getEvents();
    const networkEvents = network.getGA4Events();

    // Find specific event in both
    const dataLayerClick = dataLayerEvents.find(e => e.event === 'button_click');
    const networkClick = networkEvents.find(e => e.eventName === 'button_click');

    // Ensure event exists in both places
    expect(dataLayerClick).toBeTruthy();
    expect(networkClick).toBeTruthy();

    // Compare parameters match
    if (dataLayerClick && networkClick) {
      expect(networkClick.parameters.button_name).toBe(dataLayerClick.button_name);
    }
  });

  test('validate GA4 implementation limits', async ({ page, dataLayer, network }) => {
    const GA4Validator = require('../src/validators/ga4-validator');
    const validator = new GA4Validator({ checkReserved: true });

    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');

    const events = network.getGA4Events();
    let validationReport = {
      total: events.length,
      valid: 0,
      errors: [],
      warnings: []
    };

    events.forEach(event => {
      const validation = validator.validateHit(event);

      if (validation.valid) {
        validationReport.valid++;
      }

      validation.errors.forEach(error => {
        validationReport.errors.push({
          event: event.eventName,
          error: error.message,
          type: error.type
        });
      });

      validation.warnings.forEach(warning => {
        validationReport.warnings.push({
          event: event.eventName,
          warning: warning.message
        });
      });
    });

    console.log('GA4 Implementation Report:', validationReport);

    // Fail test if critical errors found
    expect(validationReport.errors.filter(e =>
      e.type === 'INVALID_EVENT_NAME' ||
      e.type === 'DEPRECATED_UNIVERSAL_ANALYTICS'
    ).length).toBe(0);
  });

});