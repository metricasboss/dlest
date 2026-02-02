/**
 * Puppeteer Replay Parser
 *
 * Converts Puppeteer Replay JSON format into the internal normalized format
 * compatible with DLest's analytics mapper and test generator
 */

class PuppeteerReplayParser {
  constructor() {
    this.supportedStepTypes = new Set([
      'setViewport',
      'navigate',
      'click',
      'doubleClick',
      'change',
      'scroll',
      'hover',
      'waitForElement',
      'waitForExpression',
      'keyDown',
      'keyUp',
      'close'
    ]);
  }

  /**
   * Parse Puppeteer Replay JSON into structured format
   * @param {Object|string} recordingJson
   * @returns {Object} Normalized recording in internal format
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
      throw new Error(`Failed to parse Puppeteer Replay JSON: ${error.message}`);
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
   * Normalize a Puppeteer Replay step into internal format
   * Main difference: Puppeteer uses simple arrays for selectors,
   * we need nested arrays for compatibility
   */
  normalizeStep(step, index) {
    const normalized = {
      id: `step_${index}`,
      type: this.mapStepType(step.type),
      originalStep: step,
      sourceFormat: 'puppeteer-replay'
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

      case 'doubleClick':
        normalized.selector = this.extractBestSelector(step.selectors);
        normalized.action = `await page.dblclick('${normalized.selector}');`;
        normalized.comment = 'Double-click action';
        break;

      case 'change':
        // Map 'change' to 'fill' for compatibility
        normalized.type = 'fill';
        normalized.selector = this.extractBestSelector(step.selectors);
        normalized.text = step.value || '';
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
        // Extract only width and height, ignore Puppeteer-specific fields
        normalized.width = step.width;
        normalized.height = step.height;
        normalized.action = `await page.setViewportSize({ width: ${step.width}, height: ${step.height} });`;

        // Add comment if Puppeteer-specific fields are present
        if (step.deviceScaleFactor || step.isMobile) {
          normalized.comment = `Original viewport had additional properties (deviceScaleFactor, isMobile, etc.)`;
        }
        break;

      case 'waitForElement':
        normalized.selector = this.extractBestSelector(step.selectors);
        normalized.action = `await page.waitForSelector('${normalized.selector}');`;
        break;

      case 'waitForExpression':
        // Convert to comment/TODO - not directly supported in Playwright
        normalized.action = `// TODO: Implement waitForExpression - ${step.expression || 'custom expression'}`;
        normalized.comment = 'Puppeteer waitForExpression needs manual conversion';
        break;

      case 'keyDown':
        normalized.key = step.key;
        normalized.action = `await page.keyboard.press('${step.key}');`;
        break;

      case 'keyUp':
        normalized.key = step.key;
        normalized.action = `// keyUp: ${step.key} (handled by press())`;
        normalized.comment = 'KeyUp events are typically handled by press()';
        break;

      case 'close':
        // Ignore close steps - not relevant for analytics tests
        normalized.action = '// Browser close step skipped (not relevant for test)';
        normalized.comment = 'Close action from Puppeteer recording';
        break;

      default:
        normalized.action = `// TODO: Handle ${step.type} step`;
        normalized.comment = `Unsupported step type: ${step.type}`;
    }

    return normalized;
  }

  /**
   * Map Puppeteer step type to internal type
   */
  mapStepType(puppeteerType) {
    const typeMap = {
      'change': 'fill',
      'doubleClick': 'click',
      // Other types remain the same
    };

    return typeMap[puppeteerType] || puppeteerType;
  }

  /**
   * Normalize selectors from Puppeteer format to internal format
   * Puppeteer: ["selector1", "selector2"]
   * Internal: [["selector1"], ["selector2"]]
   */
  normalizeSelectors(selectors) {
    if (!Array.isArray(selectors)) {
      return [];
    }

    // Check if already nested array format
    if (selectors.length > 0 && Array.isArray(selectors[0])) {
      return selectors; // Already in nested format
    }

    // Convert simple array to nested array
    return selectors.map(selector => [selector]);
  }

  /**
   * Extract the best selector from Puppeteer's selector array
   * Applies same priority logic as Chrome Recorder parser
   */
  extractBestSelector(selectors) {
    if (!Array.isArray(selectors) || selectors.length === 0) {
      return 'SELECTOR_NOT_FOUND';
    }

    // Normalize to nested format first
    const normalizedSelectors = this.normalizeSelectors(selectors);

    // Priority order: data-testid > id > aria > stable selectors > fallback
    for (const selectorGroup of normalizedSelectors) {
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
    const firstSelector = Array.isArray(normalizedSelectors[0])
      ? normalizedSelectors[0][0]
      : normalizedSelectors[0];

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
    // Use custom comment if provided
    if (step.comment) {
      return step.comment;
    }

    switch (step.type) {
      case 'navigate':
        return `Navigate to ${step.url}`;
      case 'click':
        return `Click element: ${step.selector}`;
      case 'fill':
        return `Fill input: ${step.selector}`;
      case 'setViewport':
        return `Set viewport to ${step.width}x${step.height}`;
      case 'hover':
        return `Hover over: ${step.selector}`;
      default:
        return `Perform ${step.type} action`;
    }
  }

  /**
   * Identify potential analytics tracking points
   * Reuses same logic as Chrome Recorder parser
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
      createdAt: new Date().toISOString(),
      sourceFormat: 'puppeteer-replay'
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

module.exports = { PuppeteerReplayParser };
