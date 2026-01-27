/**
 * Auto-generated DLest test from Chrome DevTools Recording
 * Original title: Integration Test Recording
 * Generated on: 2026-01-27T13:09:59.084Z
 * Journey type: ecommerce (high confidence)
 * Steps: 3
 * Suggested events: 4
 * 
 * TODO: Review and adjust the expected data layer events below
 * TODO: Update selectors if they seem fragile
 * TODO: Add meaningful assertions based on your actual implementation
 */

const { test, expect } = require('dlest');

test.describe('Integration Test Recording', () => {
  test('Generated from Chrome Recording', async ({ page, dataLayer }) => {
    // Generated from 3 recorded steps

    // Step 1: Navigate to https://example-store.com/product/123
    await page.goto('https://example-store.com/product/123');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('page_view', { page_location: expect.any(String), page_title: expect.any(String) });
    expect(dataLayer).toHaveEvent('view_item', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.any(Array)
    });

    // Step 2: Click aria/Adicionar ao carrinho
    await page.click('aria/Adicionar ao carrinho');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('add_to_cart', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.arrayContaining([expect.objectContaining({item_id: expect.any(String), item_name: expect.any(String), quantity: expect.any(Number)})])
    });

    // Step 3: Click aria/Finalizar compra
    await page.click('aria/Finalizar compra');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('purchase', {
      transaction_id: expect.any(String),
      currency: expect.any(String),
      value: expect.any(Number),
      tax: expect.any(Number),
      shipping: expect.any(Number),
      items: expect.any(Array)
    });
  });
});
