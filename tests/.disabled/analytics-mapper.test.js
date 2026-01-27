const { AnalyticsMapper } = require('../../../src/recorder/analytics-mapper');

describe('AnalyticsMapper', () => {
  let mapper;

  beforeEach(() => {
    mapper = new AnalyticsMapper();
  });

  describe('mapStepsToEvents', () => {
    test('should map basic navigation to page_view', () => {
      const steps = [
        {
          id: 'step_0',
          type: 'navigate',
          url: 'https://example.com'
        }
      ];

      const result = mapper.mapStepsToEvents(steps);
      
      expect(result.journeyType).toBeDefined();
      expect(result.events).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.events.length).toBeGreaterThan(0);
      
      const navEvent = result.events[0];
      expect(navEvent.events.some(e => e.eventName === 'page_view')).toBe(true);
    });

    test('should identify e-commerce journey and map appropriate events', () => {
      const steps = [
        {
          id: 'step_0',
          type: 'navigate',
          url: 'https://store.com/product/123'
        },
        {
          id: 'step_1',
          type: 'click',
          selector: '#add-to-cart-button'
        },
        {
          id: 'step_2',
          type: 'click',
          selector: '#checkout-btn'
        }
      ];

      const result = mapper.mapStepsToEvents(steps);
      
      expect(result.journeyType.primary).toBe('ecommerce');
      
      // Should have page_view for navigation
      const navEvent = result.events.find(e => e.stepType === 'navigate');
      expect(navEvent.events.some(e => e.eventName === 'page_view')).toBe(true);
      
      // Should detect add_to_cart
      const addToCartEvent = result.events.find(e => 
        e.events.some(event => event.eventName === 'add_to_cart'));
      expect(addToCartEvent).toBeDefined();
    });

    test('should identify form journey', () => {
      const steps = [
        {
          id: 'step_0',
          type: 'fill',
          selector: '#email-input'
        },
        {
          id: 'step_1',
          type: 'fill',
          selector: '#name-input'
        },
        {
          id: 'step_2',
          type: 'click',
          selector: '#submit-button'
        }
      ];

      const result = mapper.mapStepsToEvents(steps);
      
      expect(result.journeyType.primary).toBe('form');
      expect(result.events.some(e => 
        e.events.some(event => event.eventName === 'form_submit'))).toBe(true);
    });
  });

  describe('identifyJourneyType', () => {
    test('should identify e-commerce journey from URL patterns', () => {
      const steps = [
        {
          type: 'navigate',
          url: 'https://store.com/product/smartphone'
        }
      ];
      const metadata = { domains: ['store.com'] };

      const result = mapper.identifyJourneyType(steps, metadata);
      
      expect(result.primary).toBe('ecommerce');
      expect(result.indicators.ecommerce).toBeGreaterThan(0);
    });

    test('should identify e-commerce journey from selector patterns', () => {
      const steps = [
        {
          type: 'click',
          selector: '#add-to-cart-btn'
        },
        {
          type: 'click',
          selector: '#checkout-button'
        }
      ];

      const result = mapper.identifyJourneyType(steps, {});
      
      expect(result.primary).toBe('ecommerce');
      expect(result.indicators.ecommerce).toBeGreaterThan(1);
    });

    test('should identify e-commerce journey from aria labels', () => {
      const steps = [
        {
          type: 'click',
          selector: 'button',
          originalStep: {
            selectors: [
              ['aria/Finalizar compra'],
              ['#checkout-btn']
            ]
          }
        }
      ];

      const result = mapper.identifyJourneyType(steps, {});
      
      expect(result.primary).toBe('ecommerce');
      expect(result.indicators.ecommerce).toBeGreaterThan(1);
    });

    test('should identify form journey', () => {
      const steps = [
        {
          type: 'fill',
          selector: '#email'
        },
        {
          type: 'fill',
          selector: '#password'
        },
        {
          type: 'click',
          selector: '#submit'
        }
      ];

      const result = mapper.identifyJourneyType(steps, {});
      
      expect(result.primary).toBe('form');
      expect(result.indicators.form).toBeGreaterThan(0);
    });

    test('should identify authentication journey', () => {
      const steps = [
        {
          type: 'navigate',
          url: 'https://app.com/login'
        },
        {
          type: 'fill',
          selector: '#password-input'
        },
        {
          type: 'click',
          selector: '#login-button'
        }
      ];

      const result = mapper.identifyJourneyType(steps, {});
      
      expect(result.primary).toBe('authentication');
      expect(result.indicators.authentication).toBeGreaterThan(0);
    });

    test('should calculate confidence levels', () => {
      const steps = [
        {
          type: 'click',
          selector: '#add-to-cart'
        },
        {
          type: 'click',
          selector: '#checkout'
        },
        {
          type: 'click',
          selector: '#purchase'
        }
      ];

      const result = mapper.identifyJourneyType(steps, {});
      
      expect(result.confidence).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(result.confidence);
    });
  });

  describe('mapNavigationStep', () => {
    test('should always suggest page_view for navigation', () => {
      const step = {
        type: 'navigate',
        url: 'https://example.com'
      };
      const context = { journeyType: 'navigation' };

      const result = mapper.mapNavigationStep(step, context);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(e => e.eventName === 'page_view')).toBe(true);
      
      const pageViewEvent = result.find(e => e.eventName === 'page_view');
      expect(pageViewEvent.confidence).toBe('high');
      expect(pageViewEvent.expectedData).toHaveProperty('page_location');
      expect(pageViewEvent.expectedData).toHaveProperty('page_title');
    });

    test('should suggest view_item for product pages', () => {
      const step = {
        type: 'navigate',
        url: 'https://store.com/product/123'
      };
      const context = { journeyType: 'ecommerce' };

      const result = mapper.mapNavigationStep(step, context);
      
      expect(result.some(e => e.eventName === 'view_item')).toBe(true);
      
      const viewItemEvent = result.find(e => e.eventName === 'view_item');
      expect(viewItemEvent.confidence).toBe('high');
      expect(viewItemEvent.expectedData).toHaveProperty('currency');
      expect(viewItemEvent.expectedData).toHaveProperty('value');
      expect(viewItemEvent.expectedData).toHaveProperty('items');
    });

    test('should suggest view_item_list for category pages', () => {
      const step = {
        type: 'navigate',
        url: 'https://store.com/category/electronics'
      };
      const context = { journeyType: 'ecommerce' };

      const result = mapper.mapNavigationStep(step, context);
      
      expect(result.some(e => e.eventName === 'view_item_list')).toBe(true);
      
      const viewListEvent = result.find(e => e.eventName === 'view_item_list');
      expect(viewListEvent.confidence).toBe('medium');
    });
  });

  describe('mapClickStep', () => {
    test('should detect add to cart actions', () => {
      const step = {
        type: 'click',
        selector: '#add-to-cart-button',
        originalStep: {
          selectors: [
            ['aria/Adicionar ao carrinho'],
            ['#add-to-cart-button']
          ]
        }
      };
      const context = { journeyType: 'ecommerce' };

      const result = mapper.mapClickStep(step, context);
      
      expect(result.some(e => e.eventName === 'add_to_cart')).toBe(true);
      
      const addToCartEvent = result.find(e => e.eventName === 'add_to_cart');
      expect(addToCartEvent.confidence).toBe('high');
      expect(addToCartEvent.expectedData).toHaveProperty('currency');
      expect(addToCartEvent.expectedData).toHaveProperty('value');
      expect(addToCartEvent.expectedData).toHaveProperty('items');
    });

    test('should detect form submission', () => {
      const step = {
        type: 'click',
        selector: '#submit-button'
      };
      const context = { journeyType: 'form' };

      const result = mapper.mapClickStep(step, context);
      
      expect(result.some(e => e.eventName === 'form_submit')).toBe(true);
      
      const formSubmitEvent = result.find(e => e.eventName === 'form_submit');
      expect(formSubmitEvent.confidence).toBe('high');
    });

    test('should detect product interactions', () => {
      const step = {
        type: 'click',
        selector: '.product-image',
        originalStep: {
          selectors: [
            ['aria/Smartphone Pro'],
            ['.product-image']
          ]
        }
      };
      const context = { journeyType: 'ecommerce' };

      const result = mapper.mapClickStep(step, context);
      
      expect(result.some(e => e.eventName === 'select_item')).toBe(true);
    });

    test('should handle generic button clicks', () => {
      const step = {
        type: 'click',
        selector: '.generic-button'
      };
      const context = { journeyType: 'generic' };

      const result = mapper.mapClickStep(step, context);
      
      expect(result.some(e => e.eventName === 'click')).toBe(true);
      
      const clickEvent = result.find(e => e.eventName === 'click');
      expect(clickEvent.confidence).toBe('low');
    });
  });

  describe('mapEcommerceClick', () => {
    test('should detect checkout actions with proper flow analysis', () => {
      const step = {
        type: 'click',
        selector: '#finalizar-compra',
        originalStep: {
          selectors: [
            ['aria/Finalizar compra'],
            ['#payment-data-submit']
          ]
        }
      };
      const context = {
        journeyType: 'ecommerce',
        stepIndex: 8,
        totalSteps: 10,
        previousStep: {
          type: 'fill',
          selector: '#card-number'
        }
      };

      const result = mapper.mapEcommerceClick(step, context);
      
      // Should detect as final purchase action
      expect(result.some(e => e.eventName === 'purchase')).toBe(true);
      
      const purchaseEvent = result.find(e => e.eventName === 'purchase');
      expect(purchaseEvent.confidence).toBe('high');
      expect(purchaseEvent.expectedData).toHaveProperty('transaction_id');
      expect(purchaseEvent.expectedData).toHaveProperty('currency');
      expect(purchaseEvent.expectedData).toHaveProperty('value');
      expect(purchaseEvent.expectedData).toHaveProperty('tax');
      expect(purchaseEvent.expectedData).toHaveProperty('shipping');
    });

    test('should detect begin_checkout for first checkout step', () => {
      const step = {
        type: 'click',
        selector: '#checkout-button'
      };
      const context = {
        journeyType: 'ecommerce',
        stepIndex: 3,
        totalSteps: 8,
        previousStep: {
          type: 'click',
          selector: '#add-to-cart'
        }
      };

      const result = mapper.mapEcommerceClick(step, context);
      
      expect(result.some(e => e.eventName === 'begin_checkout')).toBe(true);
      
      const checkoutEvent = result.find(e => e.eventName === 'begin_checkout');
      expect(checkoutEvent.confidence).toBe('high');
    });

    test('should detect wishlist actions', () => {
      const step = {
        type: 'click',
        selector: '#add-to-wishlist'
      };
      const context = { journeyType: 'ecommerce' };

      const result = mapper.mapEcommerceClick(step, context);
      
      expect(result.some(e => e.eventName === 'add_to_wishlist')).toBe(true);
      
      const wishlistEvent = result.find(e => e.eventName === 'add_to_wishlist');
      expect(wishlistEvent.confidence).toBe('medium');
    });
  });

  describe('mapFormStep', () => {
    test('should map form interactions', () => {
      const step = {
        type: 'fill',
        selector: '#name-input',
        text: 'John Doe'
      };
      const context = { journeyType: 'form' };

      const result = mapper.mapFormStep(step, context);
      
      expect(result.some(e => e.eventName === 'form_interaction')).toBe(true);
      
      const formEvent = result.find(e => e.eventName === 'form_interaction');
      expect(formEvent.expectedData).toHaveProperty('form_field');
      expect(formEvent.expectedData).toHaveProperty('interaction_type');
    });

    test('should detect email fields', () => {
      const step = {
        type: 'fill',
        selector: '#email-input',
        text: 'user@example.com'
      };
      const context = { journeyType: 'form' };

      const result = mapper.mapFormStep(step, context);
      
      expect(result.some(e => e.eventName === 'email_input')).toBe(true);
    });

    test('should detect search fields', () => {
      const step = {
        type: 'fill',
        selector: '#search-input',
        text: 'smartphones'
      };
      const context = { journeyType: 'form' };

      const result = mapper.mapFormStep(step, context);
      
      expect(result.some(e => e.eventName === 'search')).toBe(true);
      
      const searchEvent = result.find(e => e.eventName === 'search');
      expect(searchEvent.confidence).toBe('high');
      expect(searchEvent.expectedData.search_term).toBe('smartphones');
    });
  });

  describe('helper methods', () => {
    test('isProductInteraction should detect product interactions', () => {
      const step = {
        originalStep: {
          selectors: [
            ['aria/Smartphone Pro Max'],
            ['.product-image']
          ]
        }
      };

      const result = mapper.isProductInteraction('product-link', step, {});
      expect(result).toBe(true);
    });

    test('isAddToCartAction should detect add to cart actions', () => {
      const step = {
        originalStep: {
          selectors: [
            ['aria/Adicionar ao carrinho'],
            ['#add-to-cart']
          ]
        }
      };

      const result = mapper.isAddToCartAction('add-to-cart', step, {});
      expect(result).toBe(true);
    });

    test('isCheckoutAction should detect checkout actions', () => {
      const step = {
        originalStep: {
          selectors: [
            ['aria/Finalizar compra'],
            ['#checkout-btn']
          ]
        }
      };

      const result = mapper.isCheckoutAction('checkout', step, {});
      expect(result).toBe(true);
    });

    test('isFirstCheckoutStep should determine checkout flow position', () => {
      const context = {
        previousStep: {
          selector: '#add-to-cart'
        }
      };

      const result = mapper.isFirstCheckoutStep(context);
      expect(result).toBe(true);
    });

    test('isFinalCheckoutStep should detect final purchase steps', () => {
      const context = {
        stepIndex: 8,
        totalSteps: 10
      };

      const result = mapper.isFinalCheckoutStep('finalizar-compra', context);
      expect(result).toBe(true);
    });
  });

  describe('confidence calculation', () => {
    test('should calculate overall confidence correctly', () => {
      const mappings = [
        { confidence: 'high' },
        { confidence: 'high' },
        { confidence: 'medium' }
      ];

      const result = mapper.calculateOverallConfidence(mappings);
      expect(result).toBe('high');
    });

    test('should handle mixed confidence levels', () => {
      const mappings = [
        { confidence: 'medium' },
        { confidence: 'low' },
        { confidence: 'medium' }
      ];

      const result = mapper.calculateOverallConfidence(mappings);
      expect(result).toBe('medium');
    });

    test('should handle empty mappings', () => {
      const result = mapper.calculateOverallConfidence([]);
      expect(result).toBe('none');
    });
  });

  describe('event summary generation', () => {
    test('should generate comprehensive summary', () => {
      const mappedEvents = [
        {
          events: [
            { eventName: 'page_view', confidence: 'high' },
            { eventName: 'view_item', confidence: 'high' }
          ]
        },
        {
          events: [
            { eventName: 'add_to_cart', confidence: 'high' }
          ]
        },
        {
          events: [
            { eventName: 'purchase', confidence: 'medium' }
          ]
        }
      ];

      const result = mapper.generateEventSummary(mappedEvents);
      
      expect(result.totalEvents).toBe(4);
      expect(result.highConfidenceEvents).toBe(3);
      expect(result.confidenceRatio).toBe(0.75);
      expect(result.eventTypes).toContain('page_view');
      expect(result.eventTypes).toContain('add_to_cart');
      expect(result.eventTypes).toContain('purchase');
      expect(result.eventCounts.page_view).toBe(1);
      expect(result.eventCounts.add_to_cart).toBe(1);
    });

    test('should recommend appropriate templates', () => {
      const eventCounts = {
        page_view: 2,
        add_to_cart: 1,
        purchase: 1
      };

      const result = mapper.recommendTemplate(eventCounts);
      expect(result).toBe('ecommerce');
    });

    test('should recommend form template for form events', () => {
      const eventCounts = {
        page_view: 1,
        form_submit: 1,
        form_interaction: 3
      };

      const result = mapper.recommendTemplate(eventCounts);
      expect(result).toBe('form');
    });

    test('should recommend spa template for navigation-heavy flows', () => {
      const eventCounts = {
        page_view: 5
      };

      const result = mapper.recommendTemplate(eventCounts);
      expect(result).toBe('spa');
    });

    test('should default to basic template', () => {
      const eventCounts = {
        click: 1,
        custom_event: 1
      };

      const result = mapper.recommendTemplate(eventCounts);
      expect(result).toBe('basic');
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle steps without selectors', () => {
      const steps = [
        {
          id: 'step_0',
          type: 'click',
          selector: undefined
        }
      ];

      const result = mapper.mapStepsToEvents(steps);
      expect(result.events).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
    });

    test('should handle steps with empty originalStep', () => {
      const steps = [
        {
          id: 'step_0',
          type: 'click',
          selector: '#button',
          originalStep: null
        }
      ];

      const result = mapper.mapStepsToEvents(steps);
      expect(result.events.length).toBeGreaterThan(0);
    });

    test('should handle malformed selector arrays', () => {
      const step = {
        originalStep: {
          selectors: [
            null,
            undefined,
            ['valid-selector']
          ]
        }
      };

      const result = mapper.isProductInteraction('test', step, {});
      expect(typeof result).toBe('boolean');
    });

    test('should handle empty journey indicators', () => {
      const indicators = {
        ecommerce: 0,
        form: 0,
        navigation: 0,
        authentication: 0,
        content: 0
      };

      const confidence = mapper.calculateJourneyConfidence(indicators, 0);
      expect(confidence).toBe(0);
    });
  });

  describe('real scenario integration', () => {
    test('should handle complete e-commerce flow', () => {
      const steps = [
        {
          id: 'step_0',
          type: 'navigate',
          url: 'https://store.com/product/smartphone'
        },
        {
          id: 'step_1',
          type: 'click',
          selector: '.product-image',
          originalStep: {
            selectors: [['aria/Smartphone Pro'], ['.product-image']]
          }
        },
        {
          id: 'step_2',
          type: 'click',
          selector: '#add-to-cart',
          originalStep: {
            selectors: [['aria/Adicionar ao carrinho'], ['#add-to-cart']]
          }
        },
        {
          id: 'step_3',
          type: 'click',
          selector: '#checkout',
          originalStep: {
            selectors: [['aria/Finalizar'], ['#checkout']]
          }
        },
        {
          id: 'step_4',
          type: 'fill',
          selector: '#email',
          text: 'customer@example.com'
        },
        {
          id: 'step_5',
          type: 'click',
          selector: '#complete-purchase',
          originalStep: {
            selectors: [['aria/Finalizar compra'], ['#complete-purchase']]
          }
        }
      ];

      const metadata = { domains: ['store.com'] };
      const result = mapper.mapStepsToEvents(steps, metadata);

      // Should identify as e-commerce
      expect(result.journeyType.primary).toBe('ecommerce');
      expect(result.journeyType.confidence).toBe('high');

      // Should have all expected events
      const eventNames = result.events.flatMap(e => e.events.map(ev => ev.eventName));
      expect(eventNames).toContain('page_view');
      expect(eventNames).toContain('view_item');
      expect(eventNames).toContain('select_item');
      expect(eventNames).toContain('add_to_cart');
      expect(eventNames).toContain('begin_checkout');
      expect(eventNames).toContain('purchase');

      // Should recommend e-commerce template
      expect(result.summary.recommendedTemplate).toBe('ecommerce');
    });

    test('should handle complex form with multiple interactions', () => {
      const steps = [
        {
          id: 'step_0',
          type: 'navigate',
          url: 'https://app.com/signup'
        },
        {
          id: 'step_1',
          type: 'fill',
          selector: '#name',
          text: 'John Doe'
        },
        {
          id: 'step_2',
          type: 'fill',
          selector: '#email',
          text: 'john@example.com'
        },
        {
          id: 'step_3',
          type: 'fill',
          selector: '#password',
          text: 'secretpassword'
        },
        {
          id: 'step_4',
          type: 'click',
          selector: '#accept-terms'
        },
        {
          id: 'step_5',
          type: 'click',
          selector: '#submit-registration'
        }
      ];

      const result = mapper.mapStepsToEvents(steps);

      expect(result.journeyType.primary).toBe('form');
      
      const eventNames = result.events.flatMap(e => e.events.map(ev => ev.eventName));
      expect(eventNames).toContain('page_view');
      expect(eventNames).toContain('form_interaction');
      expect(eventNames).toContain('email_input');
      expect(eventNames).toContain('form_submit');
    });
  });
});