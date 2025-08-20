/**
 * Analytics Mapper
 * 
 * Intelligent mapping of user actions to expected data layer events
 * Based on common e-commerce and SPA patterns
 */

class AnalyticsMapper {
  constructor() {
    this.ecommercePatterns = this.initializeEcommercePatterns();
    this.formPatterns = this.initializeFormPatterns();
    this.navigationPatterns = this.initializeNavigationPatterns();
    this.genericPatterns = this.initializeGenericPatterns();
  }

  /**
   * Map recording steps to data layer events
   */
  mapStepsToEvents(processedSteps, metadata = {}) {
    const mappedEvents = [];
    
    // Analyze the overall journey type
    const journeyType = this.identifyJourneyType(processedSteps, metadata);
    
    processedSteps.forEach((step, index) => {
      const context = this.buildStepContext(step, index, processedSteps, journeyType);
      const eventMapping = this.mapStepToEvents(step, context);
      
      if (eventMapping) {
        mappedEvents.push(eventMapping);
      }
    });

    return {
      journeyType,
      events: mappedEvents,
      summary: this.generateEventSummary(mappedEvents)
    };
  }

  /**
   * Identify the type of user journey
   */
  identifyJourneyType(steps, metadata) {
    const indicators = {
      ecommerce: 0,
      form: 0,
      navigation: 0,
      authentication: 0,
      content: 0
    };

    // Analyze URLs
    if (metadata.domains) {
      metadata.domains.forEach(domain => {
        if (this.isEcommerceDomain(domain)) {
          indicators.ecommerce += 2;
        }
      });
    }

    // Analyze step patterns
    steps.forEach(step => {
      const selector = (step.selector || '').toLowerCase();
      const url = (step.url || '').toLowerCase();

      // Enhanced e-commerce detection
      if (selector.includes('cart') || selector.includes('checkout') || selector.includes('product') || 
          selector.includes('buy') || selector.includes('purchase') || selector.includes('price') ||
          selector.includes('finalizar') || selector.includes('compra') || selector.includes('carrinho') ||
          selector.includes('gotocheckout') || selector.includes('orderform') || selector.includes('payment')) {
        indicators.ecommerce += 1;
      }

      if (url.includes('product') || url.includes('cart') || url.includes('checkout') || url.includes('shop') ||
          url.includes('loja') || url.includes('store') || url.includes('orderplaced')) {
        indicators.ecommerce += 1;
      }

      // Check aria labels for e-commerce content
      if (step.originalStep && step.originalStep.selectors) {
        const ariaSelectors = step.originalStep.selectors
          .flat()
          .filter(sel => typeof sel === 'string' && sel.startsWith('aria/'));
        
        const hasEcommerceAria = ariaSelectors.some(aria => {
          const text = aria.substring(5).toLowerCase();
          return text.includes('finalizar') || text.includes('compra') || 
                 text.includes('produto') || text.includes('creatina') ||
                 text.includes('checkout') || text.includes('cart');
        });
        
        if (hasEcommerceAria) {
          indicators.ecommerce += 2; // Higher weight for aria content
        }
      }

      // Form indicators
      if (step.type === 'fill' || selector.includes('form') || selector.includes('input') || 
          selector.includes('submit') || selector.includes('email') || selector.includes('name')) {
        indicators.form += 1;
      }

      // Auth indicators
      if (selector.includes('login') || selector.includes('register') || selector.includes('signup') ||
          selector.includes('password') || url.includes('auth') || url.includes('login')) {
        indicators.authentication += 1;
      }

      // Navigation indicators
      if (step.type === 'navigate' || selector.includes('menu') || selector.includes('nav')) {
        indicators.navigation += 1;
      }
    });

    // Determine primary journey type
    const maxIndicator = Math.max(...Object.values(indicators));
    const primaryType = Object.keys(indicators).find(key => indicators[key] === maxIndicator);

    return {
      primary: primaryType,
      confidence: this.calculateJourneyConfidence(indicators, maxIndicator),
      indicators
    };
  }

  /**
   * Check if domain suggests e-commerce
   */
  isEcommerceDomain(domain) {
    const ecommerceIndicators = [
      'shop', 'store', 'cart', 'buy', 'product', 'commerce', 'marketplace',
      'loja', 'mercado', 'compra', 'produto'
    ];
    
    return ecommerceIndicators.some(indicator => domain.includes(indicator));
  }

  /**
   * Calculate confidence for journey type identification
   */
  calculateJourneyConfidence(indicators, maxValue) {
    const totalIndicators = Object.values(indicators).reduce((a, b) => a + b, 0);
    
    if (totalIndicators === 0) return 0;
    
    const confidence = maxValue / totalIndicators;
    
    if (confidence >= 0.6) return 'high';
    if (confidence >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Build context for a specific step
   */
  buildStepContext(step, index, allSteps, journeyType) {
    return {
      stepIndex: index,
      isFirstStep: index === 0,
      isLastStep: index === allSteps.length - 1,
      previousStep: index > 0 ? allSteps[index - 1] : null,
      nextStep: index < allSteps.length - 1 ? allSteps[index + 1] : null,
      journeyType: journeyType.primary,
      confidence: journeyType.confidence,
      totalSteps: allSteps.length
    };
  }

  /**
   * Map individual step to data layer events
   */
  mapStepToEvents(step, context) {
    const mappings = [];

    switch (step.type) {
      case 'navigate':
        mappings.push(...this.mapNavigationStep(step, context));
        break;
      case 'click':
        mappings.push(...this.mapClickStep(step, context));
        break;
      case 'fill':
        mappings.push(...this.mapFormStep(step, context));
        break;
      default:
        // No specific mapping for other step types
        break;
    }

    if (mappings.length === 0) {
      return null;
    }

    return {
      stepId: step.id,
      stepType: step.type,
      stepIndex: context.stepIndex,
      selector: step.selector,
      events: mappings,
      insertAfter: true, // Insert data layer check after the action
      confidence: this.calculateOverallConfidence(mappings)
    };
  }

  /**
   * Map navigation steps to events
   */
  mapNavigationStep(step, context) {
    const events = [];
    const url = (step.url || '').toLowerCase();

    // Always suggest page_view for navigation
    events.push({
      eventName: 'page_view',
      confidence: 'high',
      reason: 'Navigation always triggers page view',
      expectedData: {
        page_location: 'expect.any(String)',
        page_title: 'expect.any(String)'
      }
    });

    // E-commerce specific page views
    if (context.journeyType === 'ecommerce') {
      if (url.includes('product')) {
        events.push({
          eventName: 'view_item',
          confidence: 'high',
          reason: 'Product page navigation',
          expectedData: {
            currency: 'expect.any(String)',
            value: 'expect.any(Number)',
            items: 'expect.any(Array)'
          }
        });
      } else if (url.includes('category') || url.includes('search')) {
        events.push({
          eventName: 'view_item_list',
          confidence: 'medium',
          reason: 'Category/search page navigation',
          expectedData: {
            item_list_name: 'expect.any(String)',
            items: 'expect.any(Array)'
          }
        });
      }
    }

    return events;
  }

  /**
   * Map click steps to events
   */
  mapClickStep(step, context) {
    const events = [];
    const selector = (step.selector || '').toLowerCase();

    // E-commerce click patterns
    if (context.journeyType === 'ecommerce') {
      events.push(...this.mapEcommerceClick(selector, step, context));
    }

    // Form-related clicks
    if (selector.includes('submit') || selector.includes('send') || selector.includes('enviar')) {
      events.push({
        eventName: 'form_submit',
        confidence: 'high',
        reason: 'Submit button click',
        expectedData: {
          form_name: 'expect.any(String)'
        }
      });
    }

    // Generic button tracking
    if (events.length === 0 && (selector.includes('button') || selector.includes('btn'))) {
      events.push({
        eventName: 'click',
        confidence: 'low',
        reason: 'Generic button click',
        expectedData: {
          element_type: "'button'",
          element_selector: `'${step.selector}'`
        }
      });
    }

    return events;
  }

  /**
   * Map e-commerce specific clicks
   */
  mapEcommerceClick(selector, step, context) {
    const events = [];

    // Detect product interaction (more sophisticated)
    if (this.isProductInteraction(selector, step, context)) {
      events.push({
        eventName: 'select_item',
        confidence: 'high',
        reason: 'Product interaction detected',
        expectedData: {
          item_list_name: 'expect.any(String)',
          items: 'expect.arrayContaining([expect.objectContaining({' +
                  'item_id: expect.any(String), ' +
                  'item_name: expect.any(String)' +
                  '})])'
        }
      });
    }

    // Add to cart - more flexible detection
    if (this.isAddToCartAction(selector, step, context)) {
      events.push({
        eventName: 'add_to_cart',
        confidence: 'high',
        reason: 'Add to cart action detected',
        expectedData: {
          currency: 'expect.any(String)',
          value: 'expect.any(Number)',
          items: 'expect.arrayContaining([expect.objectContaining({' +
                  'item_id: expect.any(String), ' +
                  'item_name: expect.any(String), ' +
                  'quantity: expect.any(Number)' +
                  '})])'
        }
      });
    }

    // Checkout process - improved detection
    if (this.isCheckoutAction(selector, step, context)) {
      // Determine if it's begin_checkout or purchase based on context
      const isFirstCheckoutStep = this.isFirstCheckoutStep(context);
      const isFinalCheckoutStep = this.isFinalCheckoutStep(selector, context);
      
      if (isFinalCheckoutStep) {
        events.push({
          eventName: 'purchase',
          confidence: 'high',
          reason: 'Final purchase completion detected',
          expectedData: {
            transaction_id: 'expect.any(String)',
            currency: 'expect.any(String)',
            value: 'expect.any(Number)',
            tax: 'expect.any(Number)',
            shipping: 'expect.any(Number)',
            items: 'expect.any(Array)'
          }
        });
      } else if (isFirstCheckoutStep) {
        events.push({
          eventName: 'begin_checkout',
          confidence: 'high',
          reason: 'Checkout process initiated',
          expectedData: {
            currency: 'expect.any(String)',
            value: 'expect.any(Number)',
            items: 'expect.any(Array)'
          }
        });
      }
    }

    // Wishlist
    if (selector.includes('wishlist') || selector.includes('favorite') || selector.includes('favorito')) {
      events.push({
        eventName: 'add_to_wishlist',
        confidence: 'medium',
        reason: 'Wishlist action detected',
        expectedData: {
          currency: 'expect.any(String)',
          value: 'expect.any(Number)',
          items: 'expect.any(Array)'
        }
      });
    }

    // Product selection
    if (selector.includes('product') || selector.includes('item') || 
        selector.includes('produto') && !selector.includes('cart')) {
      events.push({
        eventName: 'select_item',
        confidence: 'medium',
        reason: 'Product interaction detected',
        expectedData: {
          item_list_name: 'expect.any(String)',
          items: 'expect.any(Array)'
        }
      });
    }

    return events;
  }

  /**
   * Map form steps to events
   */
  mapFormStep(step, context) {
    const events = [];
    const selector = (step.selector || '').toLowerCase();

    // Generic form interaction
    events.push({
      eventName: 'form_interaction',
      confidence: 'low',
      reason: 'Form field interaction',
      expectedData: {
        form_field: step.selector,
        interaction_type: 'fill'
      }
    });

    // Email field
    if (selector.includes('email')) {
      events.push({
        eventName: 'email_input',
        confidence: 'medium',
        reason: 'Email field detected',
        expectedData: {
          field_type: 'email'
        }
      });
    }

    // Search field
    if (selector.includes('search') || selector.includes('busca')) {
      events.push({
        eventName: 'search',
        confidence: 'high',
        reason: 'Search field interaction',
        expectedData: {
          search_term: step.text || 'expect.any(String)'
        }
      });
    }

    return events;
  }

  /**
   * Calculate overall confidence for step mapping
   */
  calculateOverallConfidence(mappings) {
    if (mappings.length === 0) return 'none';
    
    const confidenceScores = {
      'high': 3,
      'medium': 2,
      'low': 1
    };
    
    const avgScore = mappings.reduce((sum, mapping) => {
      return sum + (confidenceScores[mapping.confidence] || 0);
    }, 0) / mappings.length;
    
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Generate summary of mapped events
   */
  generateEventSummary(mappedEvents) {
    const eventCounts = {};
    let totalEvents = 0;
    let highConfidenceEvents = 0;

    mappedEvents.forEach(mapping => {
      mapping.events.forEach(event => {
        eventCounts[event.eventName] = (eventCounts[event.eventName] || 0) + 1;
        totalEvents++;
        
        if (event.confidence === 'high') {
          highConfidenceEvents++;
        }
      });
    });

    return {
      totalEvents,
      highConfidenceEvents,
      confidenceRatio: totalEvents > 0 ? highConfidenceEvents / totalEvents : 0,
      eventTypes: Object.keys(eventCounts),
      eventCounts,
      recommendedTemplate: this.recommendTemplate(eventCounts)
    };
  }

  /**
   * Recommend test template based on detected events
   */
  recommendTemplate(eventCounts) {
    const ecommerceEvents = ['add_to_cart', 'begin_checkout', 'purchase', 'view_item', 'select_item'];
    const formEvents = ['form_submit', 'form_interaction', 'email_input'];
    const navigationEvents = ['page_view'];

    const hasEcommerce = ecommerceEvents.some(event => eventCounts[event]);
    const hasForm = formEvents.some(event => eventCounts[event]);
    const hasNavigation = navigationEvents.some(event => eventCounts[event]);

    if (hasEcommerce) return 'ecommerce';
    if (hasForm) return 'form';
    if (hasNavigation) return 'spa';
    return 'basic';
  }

  // Initialize pattern configurations
  initializeEcommercePatterns() {
    return {
      addToCart: ['add-to-cart', 'addtocart', 'adicionar', 'cart-add'],
      checkout: ['checkout', 'finalizar', 'comprar', 'buy-now'],
      product: ['product', 'item', 'produto'],
      wishlist: ['wishlist', 'favorite', 'favorito', 'lista-desejos'],
      search: ['search', 'buscar', 'pesquisar']
    };
  }

  initializeFormPatterns() {
    return {
      submit: ['submit', 'send', 'enviar', 'confirmar'],
      email: ['email', '@'],
      name: ['name', 'nome'],
      phone: ['phone', 'telefone', 'celular'],
      address: ['address', 'endereco']
    };
  }

  initializeNavigationPatterns() {
    return {
      menu: ['menu', 'nav', 'navigation'],
      home: ['home', 'inicio'],
      about: ['about', 'sobre'],
      contact: ['contact', 'contato']
    };
  }

  initializeGenericPatterns() {
    return {
      button: ['button', 'btn'],
      link: ['link', 'a href'],
      modal: ['modal', 'popup', 'dialog']
    };
  }

  // Helper methods for sophisticated e-commerce detection

  /**
   * Detect if action is a product interaction
   */
  isProductInteraction(selector, step, context) {
    // Check aria labels for product descriptions
    if (step.originalStep && step.originalStep.selectors) {
      const ariaSelectors = step.originalStep.selectors
        .flat()
        .filter(sel => typeof sel === 'string' && sel.startsWith('aria/'));
      
      const hasProductAria = ariaSelectors.some(aria => {
        const text = aria.substring(5).toLowerCase(); // Remove 'aria/'
        return text.includes('produto') || text.includes('product') || 
               text.includes('item') || text.includes('creatina') ||
               text.includes('suplemento') || text.includes('supplement');
      });
      
      if (hasProductAria) return true;
    }

    // Check selectors for product patterns
    const productPatterns = ['product', 'item', 'itemimage', 'gallery'];
    return productPatterns.some(pattern => selector.includes(pattern));
  }

  /**
   * Detect if action is add to cart
   */
  isAddToCartAction(selector, step, context) {
    // Direct text detection from aria or selectors
    if (step.originalStep && step.originalStep.selectors) {
      const allSelectors = step.originalStep.selectors.flat().join(' ').toLowerCase();
      
      const addToCartPatterns = [
        'add-to-cart', 'addtocart', 'adicionar', 'cart-add', 
        'carrinho', 'comprar agora', 'buy now'
      ];
      
      if (addToCartPatterns.some(pattern => allSelectors.includes(pattern))) {
        return true;
      }
    }
    
    // Heuristic: button after product interaction is likely add to cart
    if (context.previousStep && 
        this.isProductInteraction(context.previousStep.selector || '', context.previousStep, context) &&
        selector.includes('button')) {
      return true;
    }
    
    // Context-based detection: if in e-commerce flow and clicking button
    if (context.journeyType === 'ecommerce' && 
        selector.includes('button') && 
        context.stepIndex > 2 && // Not initial steps
        context.stepIndex < context.totalSteps - 4) { // Not final steps
      return true;
    }
    
    return false;
  }

  /**
   * Detect if action is checkout related
   */
  isCheckoutAction(selector, step, context) {
    // Check aria labels and selectors for checkout terms
    if (step.originalStep && step.originalStep.selectors) {
      const allSelectors = step.originalStep.selectors.flat().join(' ').toLowerCase();
      
      const checkoutPatterns = [
        'finalizar', 'checkout', 'pagamento', 'payment', 
        'compra', 'purchase', 'orderform', 'cart-to-order'
      ];
      
      return checkoutPatterns.some(pattern => allSelectors.includes(pattern));
    }
    
    return false;
  }

  /**
   * Determine if this is the first checkout step
   */
  isFirstCheckoutStep(context) {
    // Look for patterns that indicate beginning of checkout
    if (!context.previousStep) return true;
    
    // If previous step was product-related, this is likely first checkout
    const prevSelector = (context.previousStep.selector || '').toLowerCase();
    return prevSelector.includes('cart') || prevSelector.includes('carrinho') ||
           prevSelector.includes('product') || prevSelector.includes('item');
  }

  /**
   * Determine if this is the final checkout step (purchase completion)
   */
  isFinalCheckoutStep(selector, context) {
    // Look for final purchase indicators
    const finalIndicators = [
      'finalizar compra', // Specific from the recording
      'completar', 'complete',
      'confirmar', 'confirm',
      'payment-data-submit' // From the ID in recording
    ];
    
    // Check if this is one of the last few steps
    const isNearEnd = context.stepIndex >= context.totalSteps - 3;
    
    // Check for final action patterns
    const hasFinalPattern = finalIndicators.some(indicator => 
      selector.includes(indicator));
    
    // Check if step has navigation to success/confirmation page  
    const hasSuccessNavigation = context.previousStep && 
      context.previousStep.originalStep &&
      context.previousStep.originalStep.assertedEvents &&
      context.previousStep.originalStep.assertedEvents.some(event => 
        event.url && (event.url.includes('orderPlaced') || 
                     event.url.includes('success') ||
                     event.url.includes('confirmation'))
      );
    
    return (isNearEnd && hasFinalPattern) || hasSuccessNavigation;
  }
}

module.exports = { AnalyticsMapper };