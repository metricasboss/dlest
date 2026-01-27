/**
 * DLest Core Functionality Tests
 * Basic smoke tests to ensure core features are working
 */

describe('DLest Core', () => {
  test('test framework is operational', async ({ page }) => {
    // This test verifies that the test framework can run successfully
    expect(page).toBeDefined();
    expect(page.goto).toBeDefined();
  });

  test('dataLayer proxy is available', async ({ page, dataLayer }) => {
    // Verify dataLayer is injected and available
    expect(dataLayer).toBeDefined();
    expect(dataLayer.getEvents).toBeDefined();
  });

  test('network spy is available', async ({ page, network }) => {
    // Verify network spy is available
    expect(network).toBeDefined();
  });

  test('matchers are loaded', async () => {
    // Test basic matchers
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect(123).toBeDefined();
    expect(undefined).toBeUndefined();
  });

  test('comparison matchers work', async () => {
    expect(5).toBeGreaterThan(3);
    expect(2).toBeLessThan(5);
    expect('hello').toContain('ell');
    expect([1, 2, 3]).toHaveLength(3);
  });
});
