/**
 * Auto-generated DLest test from Chrome DevTools Recording
 * Original title: E-commerce Complete Flow
 * Generated on: 2024-01-01T00:00:00.000Z
 * Journey type: ecommerce (high confidence)
 * Steps: 10
 * Suggested events: 6
 * 
 * TODO: Review and adjust the expected data layer events below
 * TODO: Update selectors if they seem fragile
 * TODO: Add meaningful assertions based on your actual implementation
 */

const { test, expect } = require('dlest');

test.describe('E-commerce Complete Flow', () => {
  test('should track analytics correctly', async ({ page, dataLayer }) => {
    // Generated from 10 recorded steps

    // Step 1: Navigate to https://example-store.com/products/smartphone
    await page.goto('https://example-store.com/products/smartphone');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('page_view', {
      page_location: expect.any(String),
      page_title: expect.any(String)
    });
    expect(dataLayer).toHaveEvent('view_item', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.any(Array)
    });

    // Step 2: Set viewport to 1280x720
    await page.setViewportSize({ width: 1280, height: 720 });

    // Step 3: Click aria/Smartphone Pro
    await page.click('aria/Smartphone Pro');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('select_item', {
      item_list_name: expect.any(String),
      items: expect.arrayContaining([expect.objectContaining({item_id: expect.any(String), item_name: expect.any(String)})])
    });

    // Step 4: Click aria/Adicionar ao carrinho
    await page.click('aria/Adicionar ao carrinho');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('add_to_cart', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.arrayContaining([expect.objectContaining({item_id: expect.any(String), item_name: expect.any(String), quantity: expect.any(Number)})])
    });

    // Step 5: Click aria/Finalizar compra
    await page.click('aria/Finalizar compra');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('begin_checkout', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.any(Array)
    });

    // Step 6: Navigate to https://example-store.com/checkout
    await page.goto('https://example-store.com/checkout');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('page_view', {
      page_location: expect.any(String),
      page_title: expect.any(String)
    });

    // Step 7: Fill #email with "customer@example.com"
    await page.fill('#email', 'customer@example.com');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('email_input', {
      field_type: 'email'
    });

    // Step 8: Fill #card-number with "4111111111111111"
    await page.fill('#card-number', '4111111111111111');

    // Step 9: Click aria/Finalizar compra
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

    // Step 10: Navigate to https://example-store.com/orderPlaced
    await page.goto('https://example-store.com/orderPlaced');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('page_view', {
      page_location: expect.any(String),
      page_title: expect.any(String)
    });
  });
});