/**
 * Network Spy for GA4
 *
 * Intercepts and captures Google Analytics 4 network requests
 * for validation and testing purposes
 */

class NetworkSpy {
  constructor(page) {
    this.page = page;
    this.ga4Events = [];
    this.allRequests = [];
    this.isListening = false;
  }

  /**
   * Start intercepting network requests
   */
  async startListening() {
    if (this.isListening) return;

    this.isListening = true;

    // Listen for all requests
    this.page.on('request', (request) => {
      const url = request.url();

      // Store all requests for debugging
      this.allRequests.push({
        url,
        method: request.method(),
        timestamp: Date.now()
      });

      // Check if it's a GA4 request
      if (this.isGA4Request(url)) {
        this.captureGA4Event(request);
      }
    });

    // Listen for responses (useful for debugging)
    this.page.on('response', (response) => {
      const url = response.url();
      if (this.isGA4Request(url)) {
        // Log response status for debugging only in verbose mode
        const status = response.status();
        if (status !== 204 && status !== 200 && process.env.DLEST_VERBOSE === 'true') {
          console.warn(`GA4 request failed with status ${status}: ${url}`);
        }
      }
    });
  }

  /**
   * Check if a URL is a GA4 tracking request
   */
  isGA4Request(url) {
    // Only track actual measurement/tracking requests, not script loading
    const trackingPatterns = [
      'google-analytics.com/g/collect',
      'analytics.google.com/g/collect',
      'google-analytics.com/j/collect', // Legacy but still used
      'stats.g.doubleclick.net/g/collect' // Display & Video 360 integration
    ];

    // Exclude script loading URLs
    const scriptPatterns = [
      'gtag/js',
      'gtm.js',
      'analytics.js'
    ];

    const isTracking = trackingPatterns.some(pattern => url.includes(pattern));
    const isScript = scriptPatterns.some(pattern => url.includes(pattern));

    return isTracking && !isScript;
  }

  /**
   * Parse GA4 event from URL (public method for testing)
   */
  parseGA4Event(urlString) {
    const parsedUrl = new URL(urlString);
    const params = this.parseGA4Parameters(parsedUrl);

    const event = {
      timestamp: Date.now(),
      url: urlString,
      method: 'GET',
      eventName: this.extractEventName(params),
      measurementId: params.tid || params.gtm,
      clientId: params.cid,
      sessionId: params.sid,
      parameters: this.extractEventParameters(params),
      rawParams: params,
      userProperties: this.extractUserProperties(params),
      items: this.extractItems(params)
    };

    return event;
  }

  /**
   * Capture and parse a GA4 event
   */
  captureGA4Event(request) {
    const url = request.url();
    const parsedUrl = new URL(url);
    const params = this.parseGA4Parameters(parsedUrl);

    const event = {
      timestamp: Date.now(),
      url: url,
      method: request.method(),
      eventName: this.extractEventName(params),
      measurementId: params.tid || params.gtm,
      clientId: params.cid,
      sessionId: params.sid,
      parameters: this.extractEventParameters(params),
      rawParams: params,
      userProperties: this.extractUserProperties(params),
      items: this.extractItems(params)
    };

    this.ga4Events.push(event);
    return event;
  }

  /**
   * Parse URL parameters from GA4 request
   */
  parseGA4Parameters(url) {
    const params = {};

    // Parse query parameters
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value;
    }

    return params;
  }

  /**
   * Extract event name from GA4 parameters
   */
  extractEventName(params) {
    // GA4 Measurement Protocol v2 uses 'en' for event name
    if (params.en) {
      return params.en;
    }

    // Legacy Universal Analytics / GA4 hybrid uses 't' for hit type
    if (params.t) {
      // Convert GA/UA hit types to GA4 event names
      const hitTypeMap = {
        'pageview': 'page_view',
        'event': params.ea || 'event', // Event Action as event name
        'transaction': 'purchase',
        'item': 'item_view',
        'social': 'social_share',
        'exception': 'exception',
        'timing': 'timing'
      };
      return hitTypeMap[params.t] || params.t;
    }

    // Fallback for other formats
    return params.event || params.e || null;
  }

  /**
   * Extract event parameters (ep.* and epn.*)
   */
  extractEventParameters(params) {
    const eventParams = {};

    for (const [key, value] of Object.entries(params)) {
      // GA4 Measurement Protocol v2 format
      // ep.* = event parameter (string)
      // epn.* = event parameter numeric
      if (key.startsWith('ep.')) {
        const paramName = key.substring(3);
        eventParams[paramName] = value;
      } else if (key.startsWith('epn.')) {
        const paramName = key.substring(4);
        eventParams[paramName] = parseFloat(value);
      }
      // Include GA4 internal parameters (start with underscore)
      else if (key.startsWith('_')) {
        eventParams[key] = value;
      }
      // Legacy/hybrid format common parameters
      else if (['v', 'tid', 'cid', 'sid', 'dl', 'dt', 'dr', 'ul', 'de', 'sr', 'vp', 'z'].includes(key)) {
        // Core tracking parameters that are commonly used
        eventParams[key] = value;
      }
      // Event-specific legacy parameters
      else if (['ea', 'el', 'ev', 'ec'].includes(key)) {
        // ea=Event Action, el=Event Label, ev=Event Value, ec=Event Category
        const legacyMap = {
          'ea': 'event_action',
          'el': 'event_label',
          'ev': 'event_value',
          'ec': 'event_category'
        };
        eventParams[legacyMap[key]] = key === 'ev' ? parseFloat(value) : value;
      }
    }

    return eventParams;
  }

  /**
   * Extract user properties (up.* and upn.*)
   */
  extractUserProperties(params) {
    const userProps = {};

    for (const [key, value] of Object.entries(params)) {
      // up.* = user property (string)
      // upn.* = user property numeric
      if (key.startsWith('up.')) {
        const propName = key.substring(3);
        userProps[propName] = value;
      } else if (key.startsWith('upn.')) {
        const propName = key.substring(4);
        userProps[propName] = parseFloat(value);
      }
    }

    return Object.keys(userProps).length > 0 ? userProps : null;
  }

  /**
   * Extract e-commerce items from parameters
   */
  extractItems(params) {
    const items = [];
    let itemIndex = 1;

    // GA4 sends items as pr1, pr2, etc. or sometimes as JSON in ep.items
    while (params[`pr${itemIndex}`]) {
      const itemData = params[`pr${itemIndex}`];
      // Parse item data (format: id~nm~ca~br~va~pr~qt~cp~ds)
      const parts = itemData.split('~');
      items.push({
        item_id: parts[0],
        item_name: parts[1],
        item_category: parts[2],
        item_brand: parts[3],
        item_variant: parts[4],
        price: parseFloat(parts[5]) || 0,
        quantity: parseInt(parts[6]) || 1,
        coupon: parts[7],
        discount: parseFloat(parts[8]) || 0
      });
      itemIndex++;
    }

    // Also check for items in event parameters
    if (params['ep.items']) {
      try {
        const jsonItems = JSON.parse(params['ep.items']);
        items.push(...jsonItems);
      } catch (e) {
        // Not JSON, might be encoded differently
      }
    }

    return items.length > 0 ? items : null;
  }

  /**
   * Get all GA4 events
   */
  getGA4Events() {
    return this.ga4Events;
  }

  /**
   * Get GA4 events for a specific event name
   */
  getGA4EventsByName(eventName) {
    return this.ga4Events.filter(event => event.eventName === eventName);
  }

  /**
   * Check if a specific event was sent
   */
  hasGA4Event(eventName) {
    return this.ga4Events.some(event => event.eventName === eventName);
  }

  /**
   * Get the last GA4 event
   */
  getLastGA4Event() {
    return this.ga4Events[this.ga4Events.length - 1] || null;
  }

  /**
   * Clear captured data
   */
  clear() {
    this.ga4Events = [];
    this.allRequests = [];
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      totalRequests: this.allRequests.length,
      ga4Events: this.ga4Events.length,
      events: this.ga4Events.map(event => event.eventName),
      lastEvent: this.getLastGA4Event()
    };
  }

  /**
   * Print formatted debug output
   */
  printDebug() {
    console.log('\n=== GA4 Network Spy Debug ===');
    console.log(`Total Requests: ${this.allRequests.length}`);
    console.log(`GA4 Events: ${this.ga4Events.length}`);

    if (this.ga4Events.length > 0) {
      console.log('\nCaptured Events:');
      this.ga4Events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.eventName || 'unnamed'}`);
        if (Object.keys(event.parameters).length > 0) {
          console.log('   Parameters:', event.parameters);
        }
        if (event.items) {
          console.log('   Items:', event.items.length);
        }
      });
    }
    console.log('===========================\n');
  }
}

module.exports = NetworkSpy;