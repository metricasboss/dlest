# Debugging

Learn how to debug your analytics tests effectively.

## Verbose Mode

Enable detailed output:

```bash
npx dlest --verbose
```

Shows:
- All captured dataLayer events
- Full event data for each event
- Expected vs actual comparison
- Helpful error messages

## Visual Debugging

Run tests with visible browser:

```bash
npx dlest --no-headless
```

Watch the browser execute your tests in real-time.

## Screenshots

Take screenshots during tests:

```javascript
test('debug with screenshot', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000');
  await page.screenshot({ path: 'debug.png' });
  await expect(dataLayer).toHaveEvent('page_view');
});
```

## Console Logs

Listen to browser console:

```javascript
test('debug with console', async ({ page, dataLayer }) => {
  page.on('console', msg => console.log('Browser:', msg.text()));
  await page.goto('http://localhost:3000');
});
```

## Next Steps

- Learn about [writing tests](/docs/guides/writing-tests)
- Explore [available matchers](/docs/api/matchers)
