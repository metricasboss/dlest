# Changelog

All notable changes to this project will be documented in this file.

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