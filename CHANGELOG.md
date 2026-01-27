# Changelog

All notable changes to this project will be documented in this file.

## [0.5.0] - 2026-01-27

### 🚀 New Features

- **Network Request Validation**: Intercept and validate actual GA4 network requests
  - New `network` fixture provides access to captured analytics requests
  - `await expect(network).toHaveGA4Event('purchase')` matcher for network validation
  - `network.getGA4Events()` and `network.getGA4EventsByName()` for detailed inspection
  - Support for both GA4 (`/g/collect`) and Universal Analytics (`/j/collect`) endpoints

- **GA4 Implementation Validation**: Comprehensive validation against official GA4 limits
  - Event name validation (≤40 characters, proper format)
  - Parameter limits (max 25 custom parameters per event)
  - String value length validation (≤100 chars, ≤500 for page_* parameters)
  - User properties validation (max 25)
  - Item parameters validation (max 10 custom per item)
  - Reserved parameter detection with warnings

- **Universal Analytics Deprecation Detection**:
  - Automatically detects deprecated UA implementations (discontinued July 1, 2023)
  - Provides migration guidance and official Google documentation links
  - Flags UA measurement IDs (UA-XXXXXX-X) and legacy endpoints as errors

- **Enhanced Test Matchers**: Added Jest-compatible matchers for better test expressiveness
  - `toBe(expected)` - Strict equality comparison
  - `toBeGreaterThan(expected)`, `toBeLessThan(expected)` - Numeric comparisons
  - `toHaveLength(expected)` - Array/string length validation
  - `toHaveProperty(property, value?)` - Object property checks
  - `toContain(expected)` - Substring/array element checks
  - `toMatch(regex)` - Regular expression matching
  - `toThrow(expected?)` - Function error validation

- **Enhanced CLI Options**:
  - `--verbose` flag for detailed network and validation output
  - `--no-headless` flag for browser visibility during debugging
  - `DLEST_VERBOSE` environment variable support

### 🛠️ Technical Improvements

- **Network Interception**: Built on Playwright's network interception capabilities
- **URL Parameter Parsing**: Handles complex GA4 parameter encoding (ep.*, epn.*, up.*)
- **Dual Validation**: Compare dataLayer events against actual network requests
- **Performance**: Minimal overhead on test execution
- **Matcher Architecture**: All matchers now available across all test contexts (dataLayer, network, basic values)

### 📚 Documentation

- Added comprehensive network validation documentation
- GA4 validation error reference table
- Migration guide for Universal Analytics users
- Complete examples for e-commerce validation
- Added TESTING.md with complete test suite documentation

### 🧪 Testing

- Core functionality: 5/5 tests passing (100%)
- Reorganized test structure for better maintainability
- Added smoke tests for framework validation

## [0.4.0] - 2025-01-02

### 🚀 New Features

- **Remote Testing**: Test analytics on staging/production environments
  - `npx dlest https://example.com` - Test any URL directly
  - `--auth-user` and `--auth-pass` options for basic authentication
  - Environment variables support (DLEST_BASE_URL, DLEST_AUTH_USER, etc.)
  - Default remote test template for quick validation

- **CI Mode**: Optimized for continuous integration pipelines
  - `--ci` flag disables colors and ensures proper exit codes
  - Environment-aware configuration

- **Enhanced Verbose Mode**: Detailed debugging information
  - Shows all captured events with full data
  - Expected vs found comparison
  - DataLayer structure analysis
  - Event timeline with indexes

### 🐛 Bug Fixes

- Fixed async matcher issues (all matchers now require `await`)
- Fixed verbose mode consistency between environments
- Fixed baseURL configuration for Playwright contexts
- Fixed unhandled promise rejections in test execution

### 📝 Documentation

- Updated README with remote testing examples
- Added CI/CD pipeline examples
- Clarified async nature of dataLayer matchers
- Added environment variables documentation

### 💅 Improvements

- Better error messages with helpful tips in Portuguese
- Consistent event capture across verbose and normal modes
- Improved test file resolution for remote testing
- Enhanced stack traces for debugging

## [0.3.0] - 2025-01-01

### 🚀 New Features

- Smart error handling with contextual tips
- Improved verbose mode output
- Better timeout error messages

## [0.2.0] - 2024-12-31

### 🚀 New Features

- Remove fixtures by default in `dlest init`
- Add `--with-fixtures` option for static HTML testing
- Intelligent .gitignore management
- Simplified project structure

## [0.1.0] - 2024-12-30

### 🎉 Initial Release

- Jest-like test runner for analytics
- Playwright integration
- Custom matchers for dataLayer testing
- Built-in static server
- Basic templates