/**
 * Auto-generated DLest test from Chrome DevTools Recording
 * Original title: Jornada de compra
 * Generated on: 2025-08-20T11:08:31.855Z
 * Journey type: ecommerce (high confidence)
 * Steps: 12
 * Suggested events: 5
 * 
 * TODO: Review and adjust the expected data layer events below
 * TODO: Update selectors if they seem fragile
 * TODO: Add meaningful assertions based on your actual implementation
 */

const { test, expect } = require('dlest');

test.describe('Jornada de compra', () => {
  test('Generated from Chrome Recording', async ({ page, dataLayer }) => {
    // Generated from 12 recorded steps

    // Step 1: Set viewport to 1751x572
    await page.setViewportSize({ width: 1751, height: 572 });

    // Step 2: Navigate to https://www.integralmedica.com.br/
    await page.goto('https://www.integralmedica.com.br/');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('page_view', { page_location: expect.any(String), page_title: expect.any(String) });

    // Step 3: Click aria/Um pote de creatina da Integralmédica
    await page.click('aria/Um pote de creatina da Integralmédica');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('select_item', {
      item_list_name: expect.any(String),
      items: expect.arrayContaining([expect.objectContaining({item_id: expect.any(String), item_name: expect.any(String)})])
    });

    // Step 4: Click aria/Close
    await page.click('aria/Close');
    // TODO: Add analytics assertion for click action

    // Step 5: Click #gallery-layout-container > div:nth-of-type(1) img.w-100
    await page.click('#gallery-layout-container > div:nth-of-type(1) img.w-100');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('select_item', {
      item_list_name: expect.any(String),
      items: expect.arrayContaining([expect.objectContaining({item_id: expect.any(String), item_name: expect.any(String)})])
    });

    // Step 6: Click div:nth-of-type(5) > div > div > div:nth-of-type(1) > div > div > div:nth-of-type(2) > button
    await page.click('div:nth-of-type(5) > div > div > div:nth-of-type(1) > div > div > div:nth-of-type(2) > button');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('add_to_cart', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.arrayContaining([expect.objectContaining({item_id: expect.any(String), item_name: expect.any(String), quantity: expect.any(Number)})])
    });

    // Step 7: Click aria/Finalizar compra
    await page.click('aria/Finalizar compra');
    // TODO: Add analytics assertion for click action

    // Step 8: Click aria/Finalizar CompraContinuar pagamento
    await page.click('aria/Finalizar CompraContinuar pagamento');
    // TODO: Add analytics assertion for click action

    // Step 9: Click aria/Revisei e meus dados estão corretos
    await page.click('aria/Revisei e meus dados estão corretos');
    // TODO: Add analytics assertion for click action

    // Step 10: Click aria/Boleto bancário - Ganhe 3% Off
    await page.click('aria/Boleto bancário - Ganhe 3% Off');
    // TODO: Add analytics assertion for click action

    // Step 11: Click aria/Finalizar compra
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

    // Step 12: Click aria/Entendi
    await page.click('aria/Entendi');
    // TODO: Add analytics assertion for click action
  });
});
