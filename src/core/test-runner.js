const { BrowserManager } = require('./browser');
const matchers = require('../matchers');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Test Runner Core
 * 
 * Main engine for executing DLest tests
 */

class TestRunner {
  constructor(config = {}) {
    this.config = config;
    this.browserManager = new BrowserManager(config);
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      startTime: null,
      endTime: null,
    };
    this.failures = [];
    this.testResults = []; // Track individual test results for export
    this.currentFile = null; // Track current test file
    this.currentSuite = null;
    this.currentTest = null;
    this.collectedTests = [];
    this.collectedSuites = [];
    this.currentContext = null;
  }

  /**
   * Run test files
   */
  async runTests(testFiles) {
    this.stats.startTime = Date.now();
    
    console.log(chalk.cyan('🧪 DLest - Data Layer Test Runner\n'));

    try {
      // Setup browser
      await this.browserManager.launch();

      for (const testFile of testFiles) {
        await this.runTestFile(testFile);
      }

      await this.browserManager.close();

    } catch (error) {
      console.error(chalk.red('Fatal error during test execution:'), error);
      throw error;
    } finally {
      this.stats.endTime = Date.now();

      // Export test results to cloud storage if enabled
      if (this.config.export?.enabled) {
        try {
          const { TestResultExporter } = require('../export/exporter');
          const exporter = new TestResultExporter(this.config);

          await exporter.export(
            {
              stats: this.stats,
              failures: this.failures,
              tests: this.testResults
            },
            { config: this.config }
          );
        } catch (exportError) {
          // Error already handled by exporter, just log if verbose
          if (this.config.verbose) {
            console.log(chalk.gray(`\n[DEBUG] Export error: ${exportError.message}`));
          }
        }
      }

      this.printSummary();

      if (this.config.verbose) {
        console.log(chalk.gray('\n[DEBUG] All tests completed, returning stats'));
      }
    }

    return this.stats;
  }

  /**
   * Run single test file
   */
  async runTestFile(testFilePath) {
    this.currentFile = testFilePath; // Track current file for export
    console.log(chalk.gray(`\n📄 ${path.relative(process.cwd(), testFilePath)}`));

    try {
      // Create test context
      const testContext = await this.createTestContext();
      this.currentContext = testContext;
      
      // Clear collected tests for this file
      this.collectedTests = [];
      this.collectedSuites = [];
      
      // Load test file to collect tests
      await this.collectTestsFromFile(testFilePath, testContext);
      
      // Execute collected tests
      await this.executeCollectedTests();
      
      // Cleanup context
      await testContext.cleanup();
      
    } catch (error) {
      console.error(chalk.red(`Error running test file ${testFilePath}:`), error);
      this.failures.push({
        testFile: testFilePath,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Create test execution context
   */
  async createTestContext() {
    const { page, context, networkSpy } = await this.browserManager.createPage();
    const dataLayer = this.browserManager.createDataLayerProxy(page);

    // Setup expect with custom matchers
    const expect = this.createExpectFunction(dataLayer, networkSpy);

    // Test functions
    const testFunctions = {
      test: this.createTestFunction(),
      describe: this.createDescribeFunction(),
      expect,
      beforeEach: (fn) => { this.beforeEachFn = fn; },
      afterEach: (fn) => { this.afterEachFn = fn; },
      beforeAll: (fn) => { this.beforeAllFn = fn; },
      afterAll: (fn) => { this.afterAllFn = fn; },
    };

    return {
      page,
      context,
      dataLayer,
      network: networkSpy, // Expose network spy as 'network'
      testFunctions,
      cleanup: async () => {
        try {
          await context.close();
        } catch (error) {
          console.warn('Error closing test context:', error.message);
        }
      }
    };
  }

  /**
   * Collect tests from file
   */
  async collectTestsFromFile(testFilePath, testContext) {
    const { testFunctions } = testContext;

    // Make test functions globally available
    Object.assign(global, testFunctions);

    try {
      // Clear Node.js module cache to ensure fresh execution
      delete require.cache[path.resolve(testFilePath)];
      
      // Execute test file to collect tests
      require(testFilePath);
      
    } catch (error) {
      throw new Error(`Failed to collect tests from file: ${error.message}`);
    } finally {
      // Cleanup globals except for what we need during execution
      delete global.test;
      delete global.describe;
      delete global.beforeEach;
      delete global.afterEach;
      delete global.beforeAll;
      delete global.afterAll;
    }
  }

  /**
   * Execute all collected tests
   */
  async executeCollectedTests() {
    // Group tests by suite
    const suites = {};
    const standaloneTests = [];

    for (const test of this.collectedTests) {
      if (test.suite) {
        if (!suites[test.suite]) {
          suites[test.suite] = [];
        }
        suites[test.suite].push(test);
      } else {
        standaloneTests.push(test);
      }
    }

    // Execute suites
    for (const [suiteName, suiteTests] of Object.entries(suites)) {
      console.log(chalk.blue(`\n  📋 ${suiteName}`));
      for (const test of suiteTests) {
        await this.runSingleTest(test.name, test.testFn);
      }
    }

    // Execute standalone tests
    for (const test of standaloneTests) {
      await this.runSingleTest(test.name, test.testFn);
    }
  }

  /**
   * Create test function - collects tests for later execution
   */
  createTestFunction() {
    const testFn = (name, testFn) => {
      this.collectedTests.push({
        name,
        testFn,
        suite: this.currentSuite
      });
    };
    
    // Add describe as a method of test
    testFn.describe = this.createDescribeFunction();
    
    return testFn;
  }

  /**
   * Create describe function - collects suites and their tests
   */
  createDescribeFunction() {
    return (name, describeFn) => {
      const previousSuite = this.currentSuite;
      this.currentSuite = name;
      
      this.collectedSuites.push({
        name,
        tests: []
      });
      
      try {
        describeFn();
      } finally {
        this.currentSuite = previousSuite;
      }
    };
  }

  /**
   * Create expect function with custom matchers
   */
  createExpectFunction(dataLayer, networkSpy) {
    const expect = (received) => {
      // If received is the dataLayer, return enhanced matcher
      if (received === dataLayer) {
        return this.createDataLayerMatchers(received);
      }

      // If received is the network spy, return network matchers
      if (received === networkSpy) {
        return this.createNetworkMatchers(received);
      }

      // Basic expect functionality for other values
      return this.createBasicMatchers(received);
    };

    // Add Jest-like static methods
    expect.any = (constructor) => ({
      asymmetricMatch: (value) => value != null && value.constructor === constructor,
      toString: () => `Any<${constructor.name}>`,
    });

    expect.arrayContaining = (expectedArray) => ({
      asymmetricMatch: (array) => {
        if (!Array.isArray(array)) return false;
        return expectedArray.every(expected => 
          array.some(item => JSON.stringify(item) === JSON.stringify(expected))
        );
      },
      toString: () => `ArrayContaining<${JSON.stringify(expectedArray)}>`,
    });

    expect.objectContaining = (expectedObject) => ({
      asymmetricMatch: (object) => {
        if (typeof object !== 'object' || object === null) return false;
        return Object.keys(expectedObject).every(key => 
          JSON.stringify(object[key]) === JSON.stringify(expectedObject[key])
        );
      },
      toString: () => `ObjectContaining<${JSON.stringify(expectedObject)}>`,
    });

    expect.stringContaining = (expectedString) => ({
      asymmetricMatch: (string) => {
        if (typeof string !== 'string') return false;
        return string.includes(expectedString);
      },
      toString: () => `StringContaining<${expectedString}>`,
    });

    return expect;
  }

  /**
   * Create DataLayer-specific matchers
   */
  createDataLayerMatchers(received) {
    const matcherContext = {
      isNot: false,
      promise: false,
      verbose: this.config.verbose
    };

    // Store for sharing with .not matchers
    let capturedEvents = null;

    // Include basic matchers along with dataLayer-specific ones
    const basicMatchers = this.createBasicMatchers(received);

    return {
      ...basicMatchers,
      toHaveEvent: async (eventName, eventData) => {
        // Capture events BEFORE executing the matcher (to avoid navigation issues)
        let allEvents = [];
        let dataLayerInfo = null;
        
        // Always capture events to ensure consistency
        try {
          allEvents = await received.getEvents();
            
          // Only get debug info if verbose and no events found
          if (this.config.verbose && allEvents.length === 0) {
            const page = await received.getPage();
            dataLayerInfo = await page.evaluate(() => {
              return {
                exists: typeof window.dataLayer !== 'undefined',
                isArray: Array.isArray(window.dataLayer),
                length: window.dataLayer ? window.dataLayer.length : 0,
                content: window.dataLayer ? JSON.stringify(window.dataLayer.slice(0, 5)) : null,
                spyExists: typeof window.__dlest_events !== 'undefined',
                spyLength: window.__dlest_events ? window.__dlest_events.length : 0,
                spyContent: window.__dlest_events ? JSON.stringify(window.__dlest_events.slice(0, 5)) : null
              };
            });
          }
        } catch (e) {
          if (this.config.verbose) {
            console.log(chalk.gray(`    ❌ Error getting events before test: ${e.message}`));
          }
        }
        
        if (this.config.verbose) {
          const testId = Math.random().toString(36).substr(2, 9);
          console.log(chalk.gray(`    🔧 [DEBUG] Test ID: ${testId} - About to execute matcher for "${eventName}"`));
        }
        
        // Create a mock received object that uses the pre-captured events
        const mockReceived = {
          getEvents: async () => allEvents,
          getPage: received.getPage.bind(received)
        };
        
        const result = await matchers.toHaveEvent.call(matcherContext, mockReceived, eventName, eventData);
        
        // Store for .not matchers
        capturedEvents = allEvents;
        
        if (this.config.verbose) {
          console.log(chalk.gray(`    🔧 [DEBUG] Matcher result: ${result.pass ? 'PASS' : 'FAIL'}`));
        }
        
        // Show verbose information using pre-captured data
        if (this.config.verbose) {
          const matchingEvents = allEvents.filter(event => {
            return event.event === eventName || 
                   event.eventName === eventName ||
                   event.name === eventName;
          });
          
          console.log(chalk.gray(`    🔍 Expected: event "${eventName}"${eventData ? ` with data ${JSON.stringify(eventData)}` : ''}`));
          console.log(chalk.gray(`    📊 Found: ${matchingEvents.length} matching event(s) out of ${allEvents.length} total`));
          
          if (matchingEvents.length > 0) {
            console.log(chalk.gray(`    ✅ Matching events:`));
            matchingEvents.forEach((event, index) => {
              console.log(chalk.gray(`       ${index + 1}. ${JSON.stringify(event, null, 8)}`));
            });
          }
          
          if (allEvents.length > 0) {
            console.log(chalk.gray(`    📋 All captured events:`));
            allEvents.forEach((event, index) => {
              const isMatch = event.event === eventName || event.eventName === eventName || event.name === eventName;
              const prefix = isMatch ? '    ✅' : '    ⚪';
              console.log(chalk.gray(`${prefix} ${index + 1}. ${JSON.stringify(event, null, 8)}`));
            });
          } else {
            console.log(chalk.gray(`    ⚠️  No events captured`));
            
            if (dataLayerInfo) {
              console.log(chalk.gray(`    🔍 DataLayer debug:`));
              console.log(chalk.gray(`       - window.dataLayer exists: ${dataLayerInfo.exists}`));
              console.log(chalk.gray(`       - is array: ${dataLayerInfo.isArray}`));
              console.log(chalk.gray(`       - length: ${dataLayerInfo.length}`));
              console.log(chalk.gray(`       - content: ${dataLayerInfo.content}`));
              console.log(chalk.gray(`    🔍 DLest spy debug:`));
              console.log(chalk.gray(`       - spy exists: ${dataLayerInfo.spyExists}`));
              console.log(chalk.gray(`       - spy length: ${dataLayerInfo.spyLength}`));
              console.log(chalk.gray(`       - spy content: ${dataLayerInfo.spyContent}`));
            }
          }
        }
        
        if (!result.pass) {
          let errorMessage = result.message();
          
          // Add verbose information if enabled for failures
          if (this.config.verbose) {
            try {
              const allEvents = await received.getEvents();
              if (allEvents.length > 0) {
                errorMessage += '\n\n' + chalk.gray('📋 All captured events:');
                allEvents.forEach((event, index) => {
                  errorMessage += '\n' + chalk.gray(`${index + 1}. ${JSON.stringify(event, null, 2)}`);
                });
              }
            } catch (e) {
              // Ignore errors when getting events for verbose output
            }
          }
          
          throw new Error(errorMessage);
        }
        return result;
      },
      
      toHaveEventData: async (eventData) => {
        const result = await matchers.toHaveEventData.call(matcherContext, received, eventData);
        if (!result.pass) {
          let errorMessage = result.message();
          
          if (this.config.verbose) {
            try {
              const allEvents = await received.getEvents();
              if (allEvents.length > 0) {
                errorMessage += '\n\n' + chalk.gray('📋 All captured events:');
                allEvents.forEach((event, index) => {
                  errorMessage += '\n' + chalk.gray(`${index + 1}. ${JSON.stringify(event, null, 2)}`);
                });
              }
            } catch (e) {
              // Ignore errors when getting events for verbose output
            }
          }
          
          throw new Error(errorMessage);
        }
        return result;
      },
      
      toHaveEventCount: async (eventName, count) => {
        const result = await matchers.toHaveEventCount.call(matcherContext, received, eventName, count);
        if (!result.pass) {
          let errorMessage = result.message();
          
          if (this.config.verbose) {
            try {
              const allEvents = await received.getEvents();
              if (allEvents.length > 0) {
                errorMessage += '\n\n' + chalk.gray('📋 All captured events:');
                allEvents.forEach((event, index) => {
                  errorMessage += '\n' + chalk.gray(`${index + 1}. ${JSON.stringify(event, null, 2)}`);
                });
              }
            } catch (e) {
              // Ignore errors when getting events for verbose output
            }
          }
          
          throw new Error(errorMessage);
        }
        return result;
      },
      
      toHaveEventSequence: async (sequence) => {
        const result = await matchers.toHaveEventSequence.call(matcherContext, received, sequence);
        if (!result.pass) {
          let errorMessage = result.message();
          
          if (this.config.verbose) {
            try {
              const allEvents = await received.getEvents();
              if (allEvents.length > 0) {
                errorMessage += '\n\n' + chalk.gray('📋 All captured events:');
                allEvents.forEach((event, index) => {
                  errorMessage += '\n' + chalk.gray(`${index + 1}. ${JSON.stringify(event, null, 2)}`);
                });
              }
            } catch (e) {
              // Ignore errors when getting events for verbose output
            }
          }
          
          throw new Error(errorMessage);
        }
        return result;
      },

      not: {
        toHaveEvent: async (eventName, eventData) => {
          const notMatcherContext = { isNot: true, promise: false };
          
          // Use capturedEvents if available (from verbose mode), otherwise get fresh
          const dataLayerToUse = capturedEvents ? {
            getEvents: async () => capturedEvents,
            getPage: received.getPage.bind(received)
          } : received;
          
          const result = await matchers.toHaveEvent.call(notMatcherContext, dataLayerToUse, eventName, eventData);
          if (result.pass) {
            // For .not matchers, we throw when it DOES pass (because we expected it NOT to)
            throw new Error(result.message());
          }
          return result;
        },
      }
    };
  }

  /**
   * Create Network-specific matchers
   */
  createNetworkMatchers(received) {
    const matcherContext = {
      isNot: false,
      promise: false,
      verbose: this.config.verbose
    };

    // Include basic matchers along with network-specific ones
    const basicMatchers = this.createBasicMatchers(received);

    return {
      ...basicMatchers,
      toHaveGA4Event: async (eventName, options) => {
        const result = await matchers.toHaveGA4Event.call(matcherContext, received, eventName, options);

        if (!result.pass) {
          throw new Error(result.message());
        }

        // If verbose, print debug info even on success
        if (this.config.verbose && result.pass) {
          console.log(chalk.gray(`    ✓ GA4 event "${eventName}" captured and validated`));
        }
      },

      not: {
        toHaveGA4Event: async (eventName) => {
          const result = await matchers.toHaveGA4Event.negated.call(matcherContext, received, eventName);

          if (!result.pass) {
            throw new Error(result.message());
          }
        }
      }
    };
  }

  /**
   * Create basic matchers for non-dataLayer values
   */
  createBasicMatchers(received) {
    const matcherContext = { isNot: false, promise: false };

    return {
      toBe: (expected) => {
        const result = matchers.toBe.call(matcherContext, received, expected);
        if (!result.pass) {
          throw new Error(result.message());
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(received) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(received)} to equal ${JSON.stringify(expected)}`);
        }
      },
      toBeTruthy: () => {
        const result = matchers.toBeTruthy.call(matcherContext, received);
        if (!result.pass) {
          throw new Error(result.message());
        }
      },
      toBeFalsy: () => {
        const result = matchers.toBeFalsy.call(matcherContext, received);
        if (!result.pass) {
          throw new Error(result.message());
        }
      },
      toBeDefined: () => {
        const result = matchers.toBeDefined.call(matcherContext, received);
        if (!result.pass) {
          throw new Error(result.message());
        }
      },
      toBeUndefined: () => {
        const result = matchers.toBeUndefined.call(matcherContext, received);
        if (!result.pass) {
          throw new Error(result.message());
        }
      },
      toBeGreaterThan: (expected) => {
        const result = matchers.toBeGreaterThan.call(matcherContext, received, expected);
        if (!result.pass) {
          throw new Error(result.message());
        }
      },
      toBeLessThan: (expected) => {
        const result = matchers.toBeLessThan.call(matcherContext, received, expected);
        if (!result.pass) {
          throw new Error(result.message());
        }
      },
      toHaveLength: (expected) => {
        const result = matchers.toHaveLength.call(matcherContext, received, expected);
        if (!result.pass) {
          throw new Error(result.message());
        }
      },
      toHaveProperty: (property, value) => {
        const result = matchers.toHaveProperty.call(matcherContext, received, property, value);
        if (!result.pass) {
          throw new Error(result.message());
        }
      },
      toContain: (expected) => {
        const result = matchers.toContain.call(matcherContext, received, expected);
        if (!result.pass) {
          throw new Error(result.message());
        }
      },
      toMatch: (expected) => {
        const result = matchers.toMatch.call(matcherContext, received, expected);
        if (!result.pass) {
          throw new Error(result.message());
        }
      },
      toThrow: (expected) => {
        const result = matchers.toThrow.call(matcherContext, received, expected);
        if (!result.pass) {
          throw new Error(result.message());
        }
      },
    };
  }

  /**
   * Run single test
   */
  async runSingleTest(name, testFn) {
    this.currentTest = name;
    this.stats.total++;

    const testContext = {
      page: this.currentContext.page,
      dataLayer: this.currentContext.dataLayer,
      network: this.currentContext.network,
    };

    // Make context available globally
    global.expect = this.currentContext.testFunctions.expect;
    global.page = testContext.page;
    global.dataLayer = testContext.dataLayer;
    global.network = testContext.network;

    const testStartTime = Date.now();
    let testStatus = 'passed';
    let testError = null;
    let testTip = null;
    let testStack = null;
    let dataLayerEvents = [];

    try {
      // Run beforeEach if defined
      if (this.beforeEachFn) {
        await this.beforeEachFn(testContext);
      }

      // Clear dataLayer events before test
      await testContext.dataLayer.clearEvents();

      // Run the test
      await testFn(testContext);

      // Test passed
      this.stats.passed++;
      console.log(chalk.green(`    ✓ ${name}`));

      // Capture dataLayer events if export is enabled
      if (this.config.export?.enabled && this.config.export?.include?.dataLayerEvents) {
        try {
          dataLayerEvents = await testContext.dataLayer.getEvents();
        } catch (e) {
          // Ignore errors when capturing events
        }
      }

    } catch (error) {
      // Test failed
      this.stats.failed++;
      testStatus = 'failed';
      console.log(chalk.red(`    ✗ ${name}`));

      // Enhanced error handling with helpful messages
      const enhancedError = this.enhanceErrorMessage(error);
      testError = enhancedError.message;
      testTip = enhancedError.tip;
      testStack = error.stack;

      console.log(chalk.red(`      ${enhancedError.message}`));

      // Show helpful tips for common errors
      if (enhancedError.tip) {
        console.log(chalk.yellow(`      💡 Tip: ${enhancedError.tip}`));
      }

      this.failures.push({
        suite: this.currentSuite,
        test: name,
        error: enhancedError.message,
        tip: enhancedError.tip,
        stack: error.stack,
      });

    } finally {
      // Record test result for export
      const testDuration = Date.now() - testStartTime;

      this.testResults.push({
        name: name,
        suite: this.currentSuite,
        file: this.currentFile,
        status: testStatus,
        duration: testDuration,
        timestamp: new Date().toISOString(),
        error: testError,
        tip: testTip,
        stack: testStack,
        dataLayerEvents: dataLayerEvents.length > 0 ? dataLayerEvents : undefined,
      });

      // Run afterEach if defined
      if (this.afterEachFn) {
        try {
          await this.afterEachFn(testContext);
        } catch (error) {
          console.warn(chalk.yellow(`Warning: afterEach hook failed: ${error.message}`));
        }
      }
    }
  }

  /**
   * Enhance error messages with helpful tips
   */
  enhanceErrorMessage(error) {
    const message = error.message || '';
    let enhancedMessage = message;
    let tip = null;
    
    // Timeout errors
    if (message.includes('Timeout') || message.includes('timeout')) {
      if (message.includes('waiting for selector')) {
        const selectorMatch = message.match(/waiting for selector "([^"]+)"/);
        const selector = selectorMatch ? selectorMatch[1] : 'element';
        
        enhancedMessage = `Timeout waiting for element "${selector}"`;
        tip = `Verifique se o elemento "${selector}" existe na página e se o seletor está correto. Use as ferramentas de desenvolvedor para inspecionar o elemento.`;
      }
      else if (message.includes('click')) {
        enhancedMessage = 'Timeout trying to click element';
        tip = 'Verifique se o elemento está visível e clicável. O elemento pode não ter carregado ainda ou estar coberto por outro elemento.';
      }
      else if (message.includes('fill') || message.includes('type')) {
        enhancedMessage = 'Timeout trying to fill input field';
        tip = 'Verifique se o campo de input existe e está habilitado para preenchimento.';
      }
      else if (message.includes('goto') || message.includes('navigation')) {
        enhancedMessage = 'Timeout during page navigation';
        tip = 'Verifique se a URL está correta e se o servidor está rodando. Para aplicações locais, confirme que está rodando em localhost:3000.';
      }
      else {
        enhancedMessage = 'Operation timed out';
        tip = 'A operação demorou mais que o esperado. Verifique se todos os elementos e serviços necessários estão funcionando.';
      }
    }
    
    // Element not found errors
    else if (message.includes('Element not found') || message.includes('No element found') || message.includes('strict mode violation')) {
      const selectorMatch = message.match(/selector "([^"]+)"/);
      const selector = selectorMatch ? selectorMatch[1] : 'element';
      
      enhancedMessage = `Element "${selector}" not found`;
      tip = `Verifique se o elemento "${selector}" existe na página. Use o inspector do navegador para confirmar o seletor correto.`;
    }
    
    // Network/connection errors  
    else if (message.includes('net::') || message.includes('ECONNREFUSED') || message.includes('Connection refused')) {
      enhancedMessage = 'Cannot connect to the application';
      tip = 'Verifique se sua aplicação está rodando. Para Next.js execute "npm run dev" em outro terminal.';
    }
    
    // Navigation errors
    else if (message.includes('Navigation failed') || message.includes('ERR_CONNECTION_REFUSED')) {
      enhancedMessage = 'Failed to navigate to page';
      tip = 'Verifique se a URL está correta e se o servidor está rodando na porta especificada.';
    }
    
    return {
      message: enhancedMessage,
      tip: tip
    };
  }

  /**
   * Print test summary
   */
  printSummary() {
    const duration = this.stats.endTime - this.stats.startTime;
    
    console.log(chalk.cyan('\n📊 Test Results'));
    console.log(chalk.cyan('─'.repeat(50)));
    
    if (this.stats.passed > 0) {
      console.log(chalk.green(`✓ ${this.stats.passed} passed`));
    }
    
    if (this.stats.failed > 0) {
      console.log(chalk.red(`✗ ${this.stats.failed} failed`));
    }
    
    if (this.stats.skipped > 0) {
      console.log(chalk.yellow(`⊘ ${this.stats.skipped} skipped`));
    }
    
    console.log(chalk.gray(`⏱  ${duration}ms`));
    
    if (this.failures.length > 0) {
      console.log(chalk.red('\n💥 Failures:'));
      this.failures.forEach((failure, index) => {
        console.log(chalk.red(`\n${index + 1}. ${failure.suite ? `${failure.suite} > ` : ''}${failure.test}`));
        console.log(chalk.red(`   ${failure.error}`));
        if (failure.tip) {
          console.log(chalk.yellow(`   💡 ${failure.tip}`));
        }
      });
    }

    console.log(''); // Final newline
  }
}

module.exports = { TestRunner };