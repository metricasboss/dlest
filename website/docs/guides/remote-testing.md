# Remote Testing

Test analytics on staging or production environments without running sites locally.

## Basic Usage

Test any remote URL directly:

```bash
npx dlest https://staging.example.com
```

## With Authentication

For password-protected environments:

```bash
npx dlest https://staging.example.com --auth-user=admin --auth-pass=secret
```

## Environment Variables

Set credentials via environment variables:

```bash
export DLEST_BASE_URL=https://staging.example.com
export DLEST_AUTH_USER=admin
export DLEST_AUTH_PASS=secret
npx dlest
```

## CI/CD Mode

For continuous integration pipelines:

```bash
npx dlest $STAGING_URL --ci
```

CI mode provides:
- No colors in output
- Machine-readable format
- Exit code 1 on test failures

## Custom Test Files

Run specific tests for remote environments:

```bash
npx dlest https://production.example.com --test=tests/production.test.js
```

## Configuration

```javascript title="dlest.config.js"
module.exports = {
  baseURL: process.env.DLEST_BASE_URL || 'http://localhost:3000',
  timeout: 60000, // Increase for slower remote sites
};
```

## Best Practices

1. **Use environment variables** for credentials
2. **Never commit** passwords to version control
3. **Test staging** before production
4. **Increase timeouts** for remote sites
5. **Use CI mode** in pipelines

## Next Steps

- Learn about [network validation](/guides/network-validation)
- See [CI/CD integration](/advanced/ci-cd)
- Explore [debugging techniques](/guides/debugging)
