/**
 * E-commerce Template for DLest Test Generation
 * 
 * Optimized for online shopping flows with enhanced analytics tracking
 */

const EcommerceTemplate = {
  name: 'E-commerce Template',
  description: 'Optimized for online shopping flows with comprehensive analytics tracking',
  
  /**
   * Generate test structure for e-commerce journeys
   */
  generateTest(parsedRecording, analyticsMapping, config) {
    const testName = config.testName || 'e-commerce journey should track correctly';
    const title = parsedRecording.title || 'E-commerce Journey';
    
    return {
      headerComment: this.generateEcommerceHeader(parsedRecording, analyticsMapping),
      testStructure: 'describe', // Use describe block for e-commerce tests
      testName: testName,
      suitePatterns: {
        productView: this.hasProductViewEvents(analyticsMapping),
        addToCart: this.hasAddToCartEvents(analyticsMapping),
        checkout: this.hasCheckoutEvents(analyticsMapping),
        purchase: this.hasPurchaseEvents(analyticsMapping)
      }
    };
  },

  /**
   * Generate e-commerce specific header
   */
  generateEcommerceHeader(parsedRecording, analyticsMapping) {
    const lines = [
      '/**',
      ` * Auto-generated E-commerce DLest test`,
      ` * Generated from: ${parsedRecording.title}`,
      ` * `,
      ` * This test validates analytics tracking for the complete purchase funnel:`,
      ` * - Product views and selections`,
      ` * - Add to cart interactions`,
      ` * - Checkout process tracking`,
      ` * - Purchase completion events`,
      ` * `,
      ` * TODO: Review GA4/GTM event names and parameters`,
      ` * TODO: Adjust expected data based on your analytics setup`,
      ` * TODO: Verify that selectors are stable for CI/CD`,
      ` */'
    ];
    
    return lines.join('\n');
  },

  /**
   * Check if analytics mapping has product view events
   */
  hasProductViewEvents(analyticsMapping) {
    return analyticsMapping.events.some(mapping => 
      mapping.events.some(event => 
        event.eventName === 'view_item' || event.eventName === 'select_item'
      )
    );
  },

  /**
   * Check if analytics mapping has add to cart events
   */
  hasAddToCartEvents(analyticsMapping) {
    return analyticsMapping.events.some(mapping => 
      mapping.events.some(event => event.eventName === 'add_to_cart')
    );
  },

  /**
   * Check if analytics mapping has checkout events
   */
  hasCheckoutEvents(analyticsMapping) {
    return analyticsMapping.events.some(mapping => 
      mapping.events.some(event => event.eventName === 'begin_checkout')
    );
  },

  /**
   * Check if analytics mapping has purchase events
   */
  hasPurchaseEvents(analyticsMapping) {
    return analyticsMapping.events.some(mapping => 
      mapping.events.some(event => event.eventName === 'purchase')
    );
  },

  /**
   * Generate enhanced assertions for e-commerce
   */
  enhanceEventAssertion(event, context) {
    switch (event.eventName) {
      case 'view_item':
        return {
          ...event,
          expectedData: {
            ...event.expectedData,
            // Add e-commerce specific suggestions
            'currency': 'expect.any(String)', // Usually BRL for BR sites
            'value': 'expect.any(Number)',
            'items[0].item_category': 'expect.any(String)',
            'items[0].price': 'expect.any(Number)'
          },
          todo: 'Verify product data matches your GA4 Enhanced Ecommerce setup'
        };
        
      case 'add_to_cart':
        return {
          ...event,
          expectedData: {
            ...event.expectedData,
            // GA4 Enhanced Ecommerce standard
            'currency': "'BRL'", // Brazilian Real for integralmedica.com.br
            'value': 'expect.any(Number)',
            'items[0].item_id': 'expect.any(String)',
            'items[0].item_name': 'expect.stringContaining("Creatina")', // From aria label
            'items[0].item_category': 'expect.any(String)',
            'items[0].price': 'expect.any(Number)',
            'items[0].quantity': 'expect.any(Number)'
          },
          todo: 'Verify item structure matches your product catalog'
        };
        
      case 'begin_checkout':
        return {
          ...event,
          expectedData: {
            ...event.expectedData,
            'currency': "'BRL'",
            'value': 'expect.any(Number)',
            'coupon': 'expect.any(String)', // Often present in checkout
            'items': 'expect.arrayContaining([expect.objectContaining({item_id: expect.any(String)})])'
          },
          todo: 'Add checkout-specific parameters like shipping, tax'
        };
        
      case 'purchase':
        return {
          ...event,
          expectedData: {
            ...event.expectedData,
            'transaction_id': 'expect.any(String)',
            'currency': "'BRL'",
            'value': 'expect.any(Number)',
            'tax': 'expect.any(Number)',
            'shipping': 'expect.any(Number)',
            'payment_type': 'expect.any(String)', // From boleto selection
            'coupon': 'expect.any(String)',
            'items': 'expect.arrayContaining([expect.objectContaining({' +
                    'item_id: expect.any(String), ' +
                    'price: expect.any(Number), ' +
                    'quantity: expect.any(Number)' +
                    '})])'
          },
          todo: 'Verify transaction data structure and add specific validation'
        };
        
      default:
        return event;
    }
  }
};

module.exports = { EcommerceTemplate };