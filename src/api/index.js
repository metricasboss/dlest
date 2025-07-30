/**
 * DLest Public API
 * 
 * Main entry point for DLest when used as a library
 */

const { TestRunner } = require('../core/test-runner');
const { ConfigLoader } = require('../config/loader');
const matchers = require('../matchers');

// Export main API
module.exports = {
  // Test functions (available globally in test files)
  test: null, // Will be set by test runner
  describe: null, // Will be set by test runner
  expect: null, // Will be set by test runner
  
  // Core classes for advanced usage
  TestRunner,
  ConfigLoader,
  
  // Custom matchers
  matchers,
  
  // Utility functions
  run: async (testFiles, config = {}) => {
    const configLoader = new ConfigLoader();
    const mergedConfig = configLoader.load(config);
    const testRunner = new TestRunner(mergedConfig);
    
    return await testRunner.runTests(testFiles);
  },
  
  // Version
  version: require('../../package.json').version,
};