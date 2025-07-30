const fs = require('fs');
const path = require('path');
const defaults = require('./defaults');

/**
 * Configuration Loader
 * 
 * Loads and merges DLest configuration from various sources
 */

class ConfigLoader {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.configCache = null;
  }

  /**
   * Load configuration with precedence:
   * 1. Command line options
   * 2. dlest.config.js
   * 3. package.json dlest field
   * 4. Defaults
   */
  load(cliOptions = {}) {
    if (this.configCache && !cliOptions.force) {
      return this.configCache;
    }

    const config = {
      ...defaults,
      ...this.loadFromPackageJson(),
      ...this.loadFromConfigFile(),
      ...cliOptions,
    };

    // Resolve paths relative to project root
    config.testDir = path.resolve(this.cwd, config.testDir);
    
    // Ensure testMatch is an array
    if (typeof config.testMatch === 'string') {
      config.testMatch = [config.testMatch];
    }

    // Validate configuration
    this.validate(config);

    this.configCache = config;
    return config;
  }

  /**
   * Load configuration from package.json
   */
  loadFromPackageJson() {
    const packageJsonPath = path.join(this.cwd, 'package.json');
    
    try {
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.dlest || {};
      }
    } catch (error) {
      console.warn(`Warning: Could not parse package.json: ${error.message}`);
    }
    
    return {};
  }

  /**
   * Load configuration from dlest.config.js
   */
  loadFromConfigFile() {
    const configPaths = [
      'dlest.config.js',
      'dlest.config.mjs',
      '.dlest.config.js',
      'config/dlest.js',
    ];

    for (const configPath of configPaths) {
      const fullPath = path.join(this.cwd, configPath);
      
      try {
        if (fs.existsSync(fullPath)) {
          // Clear require cache to allow config reloading
          delete require.cache[path.resolve(fullPath)];
          
          const config = require(fullPath);
          
          // Handle both module.exports and export default
          return typeof config === 'function' ? config() : config;
        }
      } catch (error) {
        throw new Error(`Error loading config file ${configPath}: ${error.message}`);
      }
    }

    return {};
  }

  /**
   * Validate configuration
   */
  validate(config) {
    // Validate browsers
    const validBrowsers = ['chromium', 'firefox', 'webkit', 'chrome', 'safari'];
    if (!Array.isArray(config.browsers)) {
      config.browsers = [config.browsers];
    }
    
    config.browsers.forEach(browser => {
      if (!validBrowsers.includes(browser.toLowerCase())) {
        throw new Error(`Invalid browser: ${browser}. Valid browsers: ${validBrowsers.join(', ')}`);
      }
    });

    // Validate timeout
    if (config.timeout <= 0) {
      throw new Error('Timeout must be greater than 0');
    }

    // Validate test directory
    if (!fs.existsSync(config.testDir)) {
      console.warn(`Warning: Test directory ${config.testDir} does not exist`);
    }

    // Validate data layer settings
    if (!config.dataLayer.variableName) {
      throw new Error('Data layer variable name cannot be empty');
    }

    if (config.dataLayer.waitTimeout <= 0) {
      throw new Error('Data layer wait timeout must be greater than 0');
    }

    return true;
  }

  /**
   * Get test files based on configuration
   */
  getTestFiles(config, patterns = []) {
    const glob = require('glob');
    
    // If specific patterns provided, use those
    if (patterns.length > 0) {
      const files = [];
      patterns.forEach(pattern => {
        try {
          const matches = glob.sync(pattern, { 
            cwd: this.cwd,
            absolute: true 
          });
          files.push(...matches);
        } catch (error) {
          throw new Error(`Error finding test files with pattern ${pattern}: ${error.message}`);
        }
      });
      return [...new Set(files)]; // Remove duplicates
    }

    // Use config patterns
    const files = [];
    config.testMatch.forEach(pattern => {
      try {
        const matches = glob.sync(pattern, { 
          cwd: config.testDir,
          absolute: true 
        });
        files.push(...matches);
      } catch (error) {
        throw new Error(`Error finding test files with pattern ${pattern}: ${error.message}`);
      }
    });

    return files;
  }

  /**
   * Create example config file
   */
  createExampleConfig(configPath = 'dlest.config.js') {
    const exampleConfig = `// DLest Configuration
module.exports = {
  // Base URL for tests
  baseURL: 'http://localhost:3000',
  
  // Browser settings
  browsers: ['chromium'], // chromium, firefox, webkit
  headless: true,
  
  // Test settings
  timeout: 30000,
  testDir: './tests',
  testMatch: ['**/*.test.js'],
  
  // Data layer settings
  dataLayer: {
    variableName: 'dataLayer', // Custom data layer variable name
    waitTimeout: 5000,         // How long to wait for events
  },
  
  // Development server settings
  serve: {
    root: './fixtures',        // Serve HTML fixtures from this directory
    port: 3000,               // Default port for dev server
  },
  
  // Output settings
  verbose: false,
  
  // Reporting
  reporter: 'default', // default, json, junit
  
  // Playwright specific settings
  playwright: {
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezone: 'America/New_York',
  }
};
`;

    const fullPath = path.join(this.cwd, configPath);
    
    if (fs.existsSync(fullPath)) {
      throw new Error(`Configuration file ${configPath} already exists`);
    }

    fs.writeFileSync(fullPath, exampleConfig, 'utf8');
    return fullPath;
  }

  /**
   * Clear configuration cache
   */
  clearCache() {
    this.configCache = null;
  }
}

module.exports = { ConfigLoader };