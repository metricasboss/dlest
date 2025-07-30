# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-01-30

### Added
- Initial release of DLest - Jest for your data layer
- Core test runner with Playwright integration
- Custom matchers for data layer testing:
  - `toHaveEvent()` - Check for specific events
  - `toHaveEventData()` - Validate event data
  - `toHaveEventCount()` - Verify event count
  - `toHaveEventSequence()` - Check event order
- Built-in static file server (Node.js)
- CLI with commands:
  - `dlest` - Run tests
  - `dlest init` - Initialize project
  - `dlest serve` - Start development server
  - `dlest install` - Install Playwright browsers
- Multiple test templates:
  - `minimal` - Basic setup
  - `basic` - Standard template (default)
  - `spa` - Single Page Application
  - `gtm` - Google Tag Manager
  - `ecommerce` - E-commerce tracking
- Configuration system with `dlest.config.js`
- Jest-like API with `test()` and `expect()`
- Data layer spy for event interception
- Auto-server option with `--serve` flag
- Organized project structure with `fixtures/` directory

### Security
- Added `.gitignore` template to prevent committing sensitive files
- Secure static server with path traversal protection

[Unreleased]: https://github.com/metricasboss/dlest/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/metricasboss/dlest/releases/tag/v0.1.0