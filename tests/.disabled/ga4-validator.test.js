const GA4Validator = require('../../src/validators/ga4-validator');

describe('GA4Validator', () => {
  let validator;

  beforeEach(() => {
    validator = new GA4Validator();
  });

  describe('Event Name Validation', () => {
    test('accepts valid event names', () => {
      const validNames = ['purchase', 'page_view', 'add_to_cart', 'custom_event_123'];

      validNames.forEach(name => {
        const result = validator.validateHit({
          eventName: name,
          measurementId: 'G-ABC123',
          parameters: {}
        });
        expect(result.valid).toBe(true);
      });
    });

    test('rejects invalid event names', () => {
      const invalidCases = [
        { name: 'this_is_a_very_long_event_name_that_exceeds_forty_chars', reason: 'too long' },
        { name: '123_starts_with_number', reason: 'starts with number' },
        { name: 'has-dashes', reason: 'contains invalid character' },
        { name: 'has spaces', reason: 'contains spaces' }
      ];

      invalidCases.forEach(({ name }) => {
        const result = validator.validateHit({
          eventName: name,
          measurementId: 'G-ABC123',
          parameters: {}
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.type === 'INVALID_EVENT_NAME')).toBe(true);
      });
    });
  });

  describe('Parameter Validation', () => {
    test('accepts valid parameters', () => {
      const result = validator.validateHit({
        eventName: 'purchase',
        measurementId: 'G-ABC123',
        parameters: {
          transaction_id: '12345',
          value: 99.99,
          currency: 'USD',
          items: [
            { item_id: 'SKU123', price: 99.99 }
          ]
        }
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects too many parameters', () => {
      const parameters = {};
      for (let i = 0; i < 30; i++) {
        parameters[`param_${i}`] = `value_${i}`;
      }

      const result = validator.validateHit({
        eventName: 'test_event',
        measurementId: 'G-ABC123',
        parameters
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'TOO_MANY_PARAMETERS')).toBe(true);
    });

    test('validates string value lengths', () => {
      const result = validator.validateHit({
        eventName: 'test_event',
        measurementId: 'G-ABC123',
        parameters: {
          short_value: 'OK',
          long_value: 'x'.repeat(101), // 101 chars, exceeds limit
          page_location: 'https://example.com/' + 'x'.repeat(480) // 500 chars, within limit
        }
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e =>
        e.type === 'INVALID_STRING_VALUE' && e.field === 'long_value'
      )).toBe(true);
    });

    test('allows extended length for page parameters', () => {
      const result = validator.validateHit({
        eventName: 'page_view',
        measurementId: 'G-ABC123',
        parameters: {
          page_location: 'https://example.com/' + 'x'.repeat(450), // Within 500 char limit
          page_referrer: 'https://referrer.com/' + 'x'.repeat(450),
          page_title: 'Title ' + 'x'.repeat(450),
          regular_param: 'x'.repeat(50) // Within 100 char limit
        }
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('Reserved Parameters', () => {
    test('warns about reserved parameters when checkReserved is true', () => {
      validator = new GA4Validator({ checkReserved: true });

      const result = validator.validateHit({
        eventName: 'test_event',
        measurementId: 'G-ABC123',
        parameters: {
          currency: 'USD', // Reserved
          value: 100, // Reserved
          custom_param: 'OK'
        }
      });

      expect(result.valid).toBe(true); // Warnings don't invalidate
      expect(result.warnings.some(w =>
        w.type === 'RESERVED_PARAMETER' && w.field === 'currency'
      )).toBe(true);
    });

    test('does not warn about reserved parameters by default', () => {
      const result = validator.validateHit({
        eventName: 'test_event',
        measurementId: 'G-ABC123',
        parameters: {
          currency: 'USD',
          value: 100
        }
      });

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Universal Analytics Detection', () => {
    test('detects UA measurement IDs', () => {
      const result = validator.validateHit({
        eventName: 'pageview',
        measurementId: 'UA-123456-1',
        parameters: {}
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e =>
        e.type === 'DEPRECATED_UNIVERSAL_ANALYTICS'
      )).toBe(true);

      const uaError = result.errors.find(e => e.type === 'DEPRECATED_UNIVERSAL_ANALYTICS');
      expect(uaError.details.discontinuedDate).toBe('2023-07-01');
      expect(uaError.details.migrationInfo).toContain('support.google.com');
    });

    test('detects UA endpoint URLs', () => {
      const result = validator.validateHit({
        eventName: 'pageview',
        measurementId: 'UA-123456-1',
        url: 'https://www.google-analytics.com/j/collect',
        parameters: {}
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e =>
        e.type === 'DEPRECATED_UNIVERSAL_ANALYTICS'
      )).toBe(true);
    });

    test('accepts GA4 measurement IDs', () => {
      const result = validator.validateHit({
        eventName: 'page_view',
        measurementId: 'G-ABC123XYZ',
        parameters: {}
      });

      expect(result.valid).toBe(true);
      expect(result.errors.some(e =>
        e.type === 'DEPRECATED_UNIVERSAL_ANALYTICS'
      )).toBe(false);
    });
  });

  describe('Item Validation', () => {
    test('validates item parameters', () => {
      const result = validator.validateHit({
        eventName: 'purchase',
        measurementId: 'G-ABC123',
        parameters: {
          items: [
            {
              item_id: 'SKU123',
              item_name: 'Product Name',
              price: 99.99,
              quantity: 1,
              custom_1: 'a',
              custom_2: 'b',
              custom_3: 'c',
              custom_4: 'd',
              custom_5: 'e',
              custom_6: 'f',
              custom_7: 'g',
              custom_8: 'h',
              custom_9: 'i',
              custom_10: 'j'
            }
          ]
        }
      });

      expect(result.valid).toBe(true);
    });

    test('rejects too many item parameters', () => {
      const item = { item_id: 'SKU123' };
      for (let i = 0; i < 15; i++) {
        item[`custom_${i}`] = `value_${i}`;
      }

      const result = validator.validateHit({
        eventName: 'purchase',
        measurementId: 'G-ABC123',
        parameters: {
          items: [item]
        }
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'TOO_MANY_ITEM_PARAMETERS')).toBe(true);
    });
  });

  describe('Complete Validation', () => {
    test('validates real-world purchase event', () => {
      const result = validator.validateHit({
        eventName: 'purchase',
        measurementId: 'G-ABCDEF1234',
        clientId: '1234567890.1234567890',
        timestamp: Date.now(),
        url: 'https://www.google-analytics.com/g/collect',
        parameters: {
          transaction_id: 'TXN123456',
          value: 299.99,
          currency: 'USD',
          tax: 25.00,
          shipping: 10.00,
          coupon: 'SAVE10',
          items: [
            {
              item_id: 'SKU123',
              item_name: 'Premium Widget',
              item_category: 'Widgets',
              item_brand: 'WidgetCo',
              price: 149.99,
              quantity: 2
            }
          ]
        }
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('provides helpful error messages', () => {
      const result = validator.validateHit({
        eventName: '123_invalid_name_that_is_also_too_long_for_ga4',
        measurementId: 'UA-123456-1',
        parameters: {
          invalid_param_name_that_is_way_too_long_for_ga4: 'value',
          valid_param: 'x'.repeat(101)
        }
      });

      expect(result.valid).toBe(false);

      const errors = result.errors.map(e => e.type);
      expect(errors).toContain('INVALID_EVENT_NAME');
      expect(errors).toContain('DEPRECATED_UNIVERSAL_ANALYTICS');
      expect(errors).toContain('INVALID_PARAMETER_NAME');
      expect(errors).toContain('INVALID_STRING_VALUE');
    });
  });
});