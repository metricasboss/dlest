// Chrome DevTools Recorder format parser
// Note: We'll implement our own parser for the Chrome Recorder JSON format

/**
 * Chrome DevTools Recorder Parser
 * 
 * Converts Chrome DevTools Recorder JSON into Playwright actions
 * for DLest test generation
 */

class ChromeRecorderParser {
  constructor() {
    this.supportedStepTypes = new Set([
      'setViewport',
      'navigate', 
      'click',
      'type',
      'fill',
      'scroll',
      'waitForElement',
      'waitForSelector',
      'hover',
      'keyDown',
      'keyUp'
    ]);
  }

  /**
   * Parse Chrome Recorder JSON into structured format
   */
  parseRecording(recordingJson) {
    try {
      // Parse the recording JSON if it's a string
      const recording = typeof recordingJson === 'string' 
        ? JSON.parse(recordingJson) 
        : recordingJson;

      // Validate the recording structure
      this.validateRecording(recording);

      // Extract and process steps
      const processedSteps = this.processSteps(recording.steps || []);

      return {
        title: recording.title || 'Untitled Recording',
        originalSteps: recording.steps,
        processedSteps,
        playwrightActions: this.convertToPlaywrightActions(processedSteps),
        analyticsPoints: this.identifyAnalyticsPoints(processedSteps),
        metadata: this.extractMetadata(recording)
      };
    } catch (error) {
      throw new Error(`Failed to parse Chrome Recorder JSON: ${error.message}`);
    }
  }

  /**
   * Validate recording structure
   */
  validateRecording(recording) {
    if (!recording || typeof recording !== 'object') {
      throw new Error('Recording must be a valid object');
    }

    if (!Array.isArray(recording.steps)) {
      throw new Error('Recording must contain a "steps" array');
    }

    if (recording.steps.length === 0) {
      throw new Error('Recording must contain at least one step');
    }
  }

  /**
   * Process raw steps into normalized format
   */
  processSteps(steps) {
    return steps
      .filter(step => this.isValidStep(step))
      .map((step, index) => this.normalizeStep(step, index));
  }

  /**
   * Check if a step is valid and supported
   */
  isValidStep(step) {
    if (!step || !step.type) {
      return false;
    }

    return this.supportedStepTypes.has(step.type);
  }

  /**
   * Normalize a step into consistent format
   */
  normalizeStep(step, index) {
    const normalized = {
      id: `step_${index}`,
      type: step.type,
      originalStep: step
    };

    switch (step.type) {
      case 'navigate':
        normalized.url = step.url;
        normalized.action = `await page.goto('${step.url}');`;
        break;

      case 'click':
        normalized.selector = this.extractBestSelector(step.selectors);
        normalized.action = `await page.click('${normalized.selector}');`;
        break;

      case 'type':
      case 'fill':
        normalized.selector = this.extractBestSelector(step.selectors);
        normalized.text = step.value || step.text || '';
        normalized.action = `await page.fill('${normalized.selector}', '${normalized.text}');`;
        break;

      case 'scroll':
        normalized.action = `await page.evaluate(() => window.scrollTo(${step.x || 0}, ${step.y || 0}));`;
        break;

      case 'hover':
        normalized.selector = this.extractBestSelector(step.selectors);
        normalized.action = `await page.hover('${normalized.selector}');`;
        break;

      case 'setViewport':
        normalized.width = step.width;
        normalized.height = step.height;
        normalized.action = `await page.setViewportSize({ width: ${step.width}, height: ${step.height} });`;
        break;

      default:
        normalized.action = `// TODO: Handle ${step.type} step`;
    }

    return normalized;
  }

  /**
   * Extract the best selector from Chrome Recorder's selector array
   */
  extractBestSelector(selectors) {
    if (!Array.isArray(selectors) || selectors.length === 0) {
      return 'SELECTOR_NOT_FOUND';
    }

    // Priority order: data-testid > id > stable selectors > fallback
    for (const selectorGroup of selectors) {
      const selector = Array.isArray(selectorGroup) ? selectorGroup[0] : selectorGroup;
      
      if (typeof selector !== 'string') continue;

      // Prioritize data-testid attributes
      if (selector.includes('[data-testid=') || selector.includes('data-testid')) {
        return selector;
      }

      // Prioritize IDs
      if (selector.startsWith('#') && !selector.includes(' ')) {
        return selector;
      }

      // Prioritize aria selectors
      if (selector.startsWith('aria/')) {
        return selector;
      }
    }

    // Return the first available selector as fallback
    const firstSelector = Array.isArray(selectors[0]) ? selectors[0][0] : selectors[0];
    return firstSelector || 'SELECTOR_NOT_FOUND';
  }

  /**
   * Convert processed steps to Playwright actions
   */
  convertToPlaywrightActions(processedSteps) {
    return processedSteps.map(step => ({
      stepId: step.id,
      type: step.type,
      code: step.action,
      comment: this.generateComment(step)
    }));
  }

  /**
   * Generate helpful comment for a step
   */
  generateComment(step) {
    switch (step.type) {
      case 'navigate':
        return `Navigate to ${step.url}`;
      case 'click':
        return `Click element: ${step.selector}`;
      case 'fill':
        return `Fill input: ${step.selector}`;
      case 'setViewport':
        return `Set viewport to ${step.width}x${step.height}`;
      default:
        return `Perform ${step.type} action`;
    }
  }

  /**
   * Identify potential analytics tracking points
   */
  identifyAnalyticsPoints(processedSteps) {
    const analyticsPoints = [];

    processedSteps.forEach((step, index) => {
      const point = this.analyzeStepForAnalytics(step, index, processedSteps);
      if (point) {
        analyticsPoints.push(point);
      }
    });

    return analyticsPoints;
  }

  /**
   * Analyze individual step for analytics opportunities
   */
  analyzeStepForAnalytics(step, index, allSteps) {
    const patterns = {
      navigate: {
        events: ['page_view'],
        comment: 'Page view tracking'
      },
      click: {
        events: this.getClickEvents(step),
        comment: this.getClickComment(step)
      },
      fill: {
        events: ['form_interaction'],
        comment: 'Form interaction tracking'
      }
    };

    const pattern = patterns[step.type];
    if (!pattern || pattern.events.length === 0) {
      return null;
    }

    return {
      stepId: step.id,
      stepIndex: index,
      type: step.type,
      suggestedEvents: pattern.events,
      comment: pattern.comment,
      confidence: this.calculateConfidence(step),
      insertionPoint: 'after' // Insert analytics check after the action
    };
  }

  /**
   * Determine potential events for click actions
   */
  getClickEvents(step) {
    const selector = (step.selector || '').toLowerCase();
    const events = [];

    // E-commerce patterns
    if (selector.includes('add-to-cart') || selector.includes('addtocart')) {
      events.push('add_to_cart');
    }
    if (selector.includes('checkout') || selector.includes('purchase')) {
      events.push('begin_checkout');
    }
    if (selector.includes('product') || selector.includes('item')) {
      events.push('select_item');
    }
    if (selector.includes('wishlist') || selector.includes('favorite')) {
      events.push('add_to_wishlist');
    }

    // Form patterns
    if (selector.includes('submit') || selector.includes('send') || selector.includes('enviar')) {
      events.push('form_submit');
    }

    // Generic interaction
    if (events.length === 0) {
      events.push('click');
    }

    return events;
  }

  /**
   * Generate comment for click events
   */
  getClickComment(step) {
    const events = this.getClickEvents(step);
    if (events.includes('add_to_cart')) return 'Add to cart tracking';
    if (events.includes('begin_checkout')) return 'Checkout process tracking';
    if (events.includes('select_item')) return 'Product selection tracking';
    if (events.includes('form_submit')) return 'Form submission tracking';
    return 'Click interaction tracking';
  }

  /**
   * Calculate confidence level for analytics suggestion
   */
  calculateConfidence(step) {
    const selector = (step.selector || '').toLowerCase();
    
    // High confidence for clear e-commerce patterns
    if (selector.includes('add-to-cart') || selector.includes('checkout')) {
      return 'high';
    }

    // Medium confidence for common patterns
    if (selector.includes('button') || selector.includes('submit') || selector.includes('product')) {
      return 'medium';
    }

    // Low confidence for generic actions
    return 'low';
  }

  /**
   * Extract metadata from recording
   */
  extractMetadata(recording) {
    return {
      title: recording.title,
      stepsCount: recording.steps ? recording.steps.length : 0,
      hasNavigation: recording.steps ? recording.steps.some(s => s.type === 'navigate') : false,
      domains: this.extractDomains(recording.steps || []),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Extract domains from navigation steps
   */
  extractDomains(steps) {
    const domains = new Set();
    
    steps
      .filter(step => step.type === 'navigate' && step.url)
      .forEach(step => {
        try {
          const url = new URL(step.url);
          domains.add(url.hostname);
        } catch (e) {
          // Ignore invalid URLs
        }
      });

    return Array.from(domains);
  }
}

module.exports = { ChromeRecorderParser };