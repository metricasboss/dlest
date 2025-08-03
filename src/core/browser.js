const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Browser Wrapper
 * 
 * Abstracts Playwright complexity and manages browser lifecycle
 */

class BrowserManager {
  constructor(config = {}) {
    this.config = {
      headless: true,
      browser: 'chromium',
      timeout: 30000,
      dataLayer: {
        variableName: 'dataLayer',
        waitTimeout: 5000,
      },
      ...config
    };
    
    this.browser = null;
    this.contexts = new Set();
  }

  /**
   * Launch browser instance
   */
  async launch() {
    if (this.browser) {
      return this.browser;
    }

    const browserType = this._getBrowserType();
    
    this.browser = await browserType.launch({
      headless: this.config.headless,
      // Add common browser args for testing
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ]
    });

    return this.browser;
  }

  /**
   * Create new browser context with DLest setup
   */
  async createContext(options = {}) {
    if (!this.browser) {
      await this.launch();
    }

    // Handle authentication
    const contextOptions = {
      viewport: { width: 1280, height: 720 },
      ...options
    };
    
    // Add baseURL if provided in config
    if (this.config.baseURL) {
      contextOptions.baseURL = this.config.baseURL;
    }
    
    // Add basic auth if provided in config
    if (this.config.auth) {
      contextOptions.httpCredentials = {
        username: this.config.auth.username,
        password: this.config.auth.password
      };
    }

    const context = await this.browser.newContext(contextOptions);

    // Track context for cleanup
    this.contexts.add(context);

    // Add data layer spy injection to all pages in this context
    await this._setupDataLayerSpy(context);

    return context;
  }

  /**
   * Create new page with DLest setup
   */
  async createPage(contextOptions = {}) {
    const context = await this.createContext(contextOptions);
    const page = await context.newPage();

    // Set default timeout
    page.setDefaultTimeout(this.config.timeout);

    return { page, context };
  }

  /**
   * Close all resources
   */
  async close() {
    // Close all contexts
    for (const context of this.contexts) {
      try {
        await context.close();
      } catch (error) {
        console.warn('Error closing context:', error.message);
      }
    }
    this.contexts.clear();

    // Close browser
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.warn('Error closing browser:', error.message);
      }
      this.browser = null;
    }
  }

  /**
   * Get browser type based on config
   */
  _getBrowserType() {
    switch (this.config.browser.toLowerCase()) {
      case 'firefox':
        return firefox;
      case 'webkit':
      case 'safari':
        return webkit;
      case 'chromium':
      case 'chrome':
      default:
        return chromium;
    }
  }

  /**
   * Setup data layer spy injection for context
   */
  async _setupDataLayerSpy(context) {
    // Read spy script
    const spyScript = this._getSpyScript();

    // Add init script to inject spy on every page
    await context.addInitScript(`
      ${spyScript}
      
      // Initialize spy when page loads
      if (typeof window !== 'undefined') {
        console.log('[DLest] Initializing data layer spy...');
        // Initialize spy with configured variable name
        window.__dlest_createDataLayerSpy('${this.config.dataLayer.variableName}');
        console.log('[DLest] Data layer spy initialized');
      }
    `);
  }

  /**
   * Get data layer spy script content
   */
  _getSpyScript() {
    const spyPath = path.join(__dirname, 'spy.js');
    
    try {
      const spyContent = fs.readFileSync(spyPath, 'utf8');
      // Don't remove anything - the script already handles both browser and Node.js
      const cleanContent = spyContent;
      
      // Log para debug
      if (this.config.verbose) {
        console.log(`[DLest] Spy script loaded (${cleanContent.length} chars)`);
      }
      
      return cleanContent;
    } catch (error) {
      throw new Error(`Failed to load data layer spy script: ${error.message}`);
    }
  }

  /**
   * Create DataLayer proxy for test context
   */
  createDataLayerProxy(page) {
    return new DataLayerProxy(page, this.config.dataLayer);
  }
}

/**
 * DataLayer Proxy
 * 
 * Provides interface to interact with captured dataLayer events
 */
class DataLayerProxy {
  constructor(page, config = {}) {
    this.page = page;
    this.config = {
      waitTimeout: 5000,
      ...config
    };
  }

  /**
   * Get all captured events
   */
  async getEvents() {
    return await this.page.evaluate(() => {
      return window.__dlest_helpers ? window.__dlest_helpers.getEvents() : [];
    });
  }

  /**
   * Get events by name
   */
  async getEventsByName(eventName) {
    return await this.page.evaluate((name) => {
      return window.__dlest_helpers ? window.__dlest_helpers.getEventsByName(name) : [];
    }, eventName);
  }

  /**
   * Get event count
   */
  async getEventCount(eventName) {
    return await this.page.evaluate((name) => {
      return window.__dlest_helpers ? window.__dlest_helpers.getEventCount(name) : 0;
    }, eventName);
  }

  /**
   * Check if event exists
   */
  async hasEvent(eventName, eventData) {
    return await this.page.evaluate((name, data) => {
      return window.__dlest_helpers ? window.__dlest_helpers.hasEvent(name, data) : false;
    }, eventName, eventData);
  }

  /**
   * Get page instance for debugging
   */
  async getPage() {
    return this.page;
  }

  /**
   * Wait for specific event
   */
  async waitForEvent(eventName, timeout = this.config.waitTimeout) {
    return await this.page.evaluate((name, ms) => {
      return window.__dlest_helpers ? window.__dlest_helpers.waitForEvent(name, ms) : 
        Promise.reject(new Error('DLest helpers not available'));
    }, eventName, timeout);
  }

  /**
   * Clear captured events
   */
  async clearEvents() {
    return await this.page.evaluate(() => {
      if (window.__dlest_helpers) {
        window.__dlest_helpers.clearEvents();
      }
    });
  }

  /**
   * Clear captured events (alias for clearEvents)
   */
  async clear() {
    return await this.clearEvents();
  }
}

module.exports = { BrowserManager, DataLayerProxy };