# Contributing to DLest

First off, thank you for considering contributing to DLest! It's people like you that make DLest such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for DLest. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

**Before Submitting A Bug Report:**
- Check the [issues](https://github.com/metricasboss/dlest/issues) to see if the problem has already been reported
- Check that the issue is not already fixed in the latest version

**How Do I Submit A Good Bug Report?**

Bugs are tracked as GitHub issues. Create an issue and provide the following information:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots if possible**

Include details about your configuration and environment:
- DLest version
- Node.js version
- Operating System
- Browser being tested

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Provide specific examples to demonstrate the enhancement**
- **Describe the current behavior and explain the expected behavior**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing style
6. Issue the pull request

## Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/dlest.git
cd dlest
```

2. Install dependencies:
```bash
npm install
```

3. Create a branch for your feature or fix:
```bash
git checkout -b feature/your-feature-name
```

4. Make your changes and test them:
```bash
npm test
```

5. Run the linter:
```bash
npm run lint
```

## Project Structure

```
dlest/
├── src/
│   ├── cli/         # CLI commands and runner
│   ├── core/        # Core functionality (test runner, browser, spy)
│   ├── matchers/    # Custom Jest-like matchers
│   ├── server/      # Built-in development server
│   └── config/      # Configuration management
├── bin/             # Executable entry point
├── templates/       # Test templates
└── tests/           # DLest's own tests
```

## Coding Conventions

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Add JSDoc comments for all public methods
- Follow existing naming conventions
- Write descriptive commit messages using [Conventional Commits](https://www.conventionalcommits.org/)

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding missing tests
- **chore**: Changes to the build process or auxiliary tools

Example:
```
feat(matchers): add toHaveEventWithin matcher

Add a new matcher that validates if an event was fired within
a specific timeframe. This is useful for testing time-sensitive
analytics events.

Closes #123
```

## Testing

- Write tests for any new functionality
- Ensure all tests pass before submitting PR
- Aim for high code coverage
- Test edge cases

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Documentation

- Update the README.md if you change functionality
- Add JSDoc comments to new functions
- Update examples if API changes
- Document breaking changes

## Release Process

Maintainers will handle releases, but for reference:

1. Update CHANGELOG.md
2. Run `npm version patch/minor/major`
3. Push with tags: `git push --follow-tags`
4. GitHub Actions will publish to NPM

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🎉