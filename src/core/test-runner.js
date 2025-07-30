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
    this.currentSuite = null;
    this.currentTest = null;
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
      this.printSummary();
    }

    return this.stats;
  }

  /**
   * Run single test file
   */
  async runTestFile(testFilePath) {
    console.log(chalk.gray(`\n📄 ${path.relative(process.cwd(), testFilePath)}`));

    try {
      // Create test context
      const testContext = await this.createTestContext();
      
      // Load and execute test file
      await this.executeTestFile(testFilePath, testContext);
      
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
    const { page, context } = await this.browserManager.createPage();
    const dataLayer = this.browserManager.createDataLayerProxy(page);

    // Setup expect with custom matchers
    const expect = this.createExpectFunction(dataLayer);
    
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
   * Execute test file with context
   */
  async executeTestFile(testFilePath, testContext) {
    const { testFunctions, page, dataLayer } = testContext;

    // Make test functions globally available
    Object.assign(global, testFunctions);

    // Also provide page and dataLayer globally for convenience
    global.page = page;
    global.dataLayer = dataLayer;

    try {
      // Clear Node.js module cache to ensure fresh execution
      delete require.cache[path.resolve(testFilePath)];
      
      // Execute test file
      require(testFilePath);
      
    } catch (error) {
      throw new Error(`Failed to execute test file: ${error.message}`);
    } finally {
      // Cleanup globals
      delete global.test;
      delete global.describe;
      delete global.expect;
      delete global.page;
      delete global.dataLayer;
      delete global.beforeEach;
      delete global.afterEach;
      delete global.beforeAll;
      delete global.afterAll;
    }
  }

  /**
   * Create test function
   */
  createTestFunction() {
    return (name, testFn) => {
      this.runSingleTest(name, testFn);
    };
  }

  /**
   * Create describe function
   */
  createDescribeFunction() {
    return (name, describeFn) => {
      const previousSuite = this.currentSuite;
      this.currentSuite = name;
      
      console.log(chalk.blue(`\n  📋 ${name}`));
      
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
  createExpectFunction(dataLayer) {
    const expect = (received) => {
      // If received is the dataLayer, return enhanced matcher
      if (received === dataLayer) {
        return this.createDataLayerMatchers(received);
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

    return expect;
  }

  /**
   * Create DataLayer-specific matchers
   */
  createDataLayerMatchers(received) {
    const matcherContext = { isNot: false, promise: false };
    
    return {
      toHaveEvent: (eventName, eventData) => {
        const result = matchers.toHaveEvent.call(matcherContext, received, eventName, eventData);
        if (!result.pass) {
          throw new Error(result.message());
        }
        return result;
      },
      
      toHaveEventData: (eventData) => {
        const result = matchers.toHaveEventData.call(matcherContext, received, eventData);
        if (!result.pass) {
          throw new Error(result.message());
        }
        return result;
      },
      
      toHaveEventCount: (eventName, count) => {
        const result = matchers.toHaveEventCount.call(matcherContext, received, eventName, count);
        if (!result.pass) {
          throw new Error(result.message());
        }
        return result;
      },
      
      toHaveEventSequence: (sequence) => {
        const result = matchers.toHaveEventSequence.call(matcherContext, received, sequence);
        if (!result.pass) {
          throw new Error(result.message());
        }
        return result;
      },

      not: {
        toHaveEvent: (eventName, eventData) => {
          const notMatcherContext = { isNot: true, promise: false };
          const result = matchers.toHaveEvent.call(notMatcherContext, received, eventName, eventData);
          if (!result.pass) {
            throw new Error(result.message());
          }
          return result;
        },
      }
    };
  }

  /**
   * Create basic matchers for non-dataLayer values
   */
  createBasicMatchers(received) {
    return {
      toBe: (expected) => {
        if (received !== expected) {
          throw new Error(`Expected ${received} to be ${expected}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(received) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(received)} to equal ${JSON.stringify(expected)}`);
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
      page: global.page,
      dataLayer: global.dataLayer,
    };

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

    } catch (error) {
      // Test failed
      this.stats.failed++;
      console.log(chalk.red(`    ✗ ${name}`));
      console.log(chalk.red(`      ${error.message}`));
      
      this.failures.push({
        suite: this.currentSuite,
        test: name,
        error: error.message,
        stack: error.stack,
      });

    } finally {
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
      });
    }

    console.log(''); // Final newline
  }
}

module.exports = { TestRunner };