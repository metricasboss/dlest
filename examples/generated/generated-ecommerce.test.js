/**
 * Auto-generated DLest test from Chrome DevTools Recording
 * Original title: E-commerce Complete Flow
 * Generated on: 2025-08-20T11:24:33.265Z
 * Journey type: ecommerce (high confidence)
 * Steps: 11
 * Suggested events: 9
 * 
 * TODO: Review and adjust the expected data layer events below
 * TODO: Update selectors if they seem fragile
 * TODO: Add meaningful assertions based on your actual implementation
 */

const { test, expect } = require('dlest');

test.describe('E-commerce Complete Flow', () => {
  test('Generated from Chrome Recording', async ({ page, dataLayer }) => {
    // Generated from 11 recorded steps

    // Step 1: Navigate to https://example-store.com/products/smartphone
    await page.goto('https://example-store.com/products/smartphone');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('page_view', { page_location: expect.any(String), page_title: expect.any(String) });
    expect(dataLayer).toHaveEvent('view_item', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.any(Array)
    });

    // Step 2: Set viewport to 1280x720
    await page.setViewportSize({ width: 1280, height: 720 });

    // Step 3: Click aria/Smartphone Pro
    await page.click('aria/Smartphone Pro');
    // TODO: Add analytics assertion for click action

    // Step 4: Click aria/Adicionar ao carrinho
    await page.click('aria/Adicionar ao carrinho');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('add_to_cart', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.arrayContaining([expect.objectContaining({item_id: expect.any(String), item_name: expect.any(String), quantity: expect.any(Number)})])
    });

    // Step 5: waitForElement action
    // TODO: Handle waitForElement step
    // TODO: Add analytics assertion for waitForElement action

    // Step 6: Click aria/Finalizar compra
    await page.click('aria/Finalizar compra');
    // TODO: Add analytics assertion for click action

    // Step 7: Navigate to https://example-store.com/checkout
    await page.goto('https://example-store.com/checkout');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('page_view', { page_location: expect.any(String), page_title: expect.any(String) });

    // Step 8: Fill [data-testid="email-input"] with "customer@example.com"
    await page.fill('[data-testid="email-input"]', 'customer@example.com');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('form_interaction', { form_field: '[data-testid="email-input"]', interaction_type: 'fill' });
    // TODO: Verify form_interaction event and adjust expected data
    expect(dataLayer).toHaveEvent('email_input', { field_type: 'email' });

    // Step 9: Fill [data-testid="card-number"] with "4111111111111111"
    await page.fill('[data-testid="card-number"]', '4111111111111111');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('form_interaction', { form_field: '[data-testid="card-number"]', interaction_type: 'fill' });
    // TODO: Verify form_interaction event and adjust expected data

    // Step 10: Click aria/Finalizar compra
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

    // Step 11: Navigate to https://example-store.com/orderPlaced
    await page.goto('https://example-store.com/orderPlaced');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('page_view', { page_location: expect.any(String), page_title: expect.any(String) });
  });
});
