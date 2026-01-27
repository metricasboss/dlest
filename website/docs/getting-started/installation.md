# Installation

Learn how to install DLest and get started with testing your analytics implementation.

## Prerequisites

Before installing DLest, make sure you have:

- **Node.js 16 or higher** - [Download Node.js](https://nodejs.org)
- **npm** or **yarn** - Package manager (comes with Node.js)

## Install DLest

Install DLest as a dev dependency in your project:

```bash
npm install --save-dev dlest
```

Or with yarn:

```bash
yarn add --dev dlest
```

## Install Playwright Browsers

DLest uses Playwright for browser automation. Install the required browsers:

```bash
npx dlest install
```

This command installs:
- ✅ Chromium (Chrome, Edge)
- ✅ Firefox
- ✅ WebKit (Safari)

:::tip
You can skip this step if you already have Playwright browsers installed in your project.
:::

## Verify Installation

Check that DLest is installed correctly:

```bash
npx dlest --version
```

You should see the installed version number.

## Next Steps

Now that you have DLest installed, you can:

1. [Initialize your project](/getting-started/quick-start) with `npx dlest init`
2. [Write your first test](/getting-started/first-test)
3. Learn about [available matchers](/api/matchers)

## Troubleshooting

### Command not found

If you get a "command not found" error, try:

```bash
# Use npx to run DLest
npx dlest

# Or install globally (not recommended)
npm install -g dlest
```

### Browser installation fails

If browser installation fails, you can install Playwright directly:

```bash
npm install --save-dev playwright
npx playwright install
```

### Permission errors

On Unix systems, you might need to make the binary executable:

```bash
chmod +x node_modules/.bin/dlest
```

This is usually done automatically by the `prepare` script in package.json.
