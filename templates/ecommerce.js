/**
 * E-commerce DLest Template
 * 
 * Template for testing common e-commerce tracking patterns
 */

const { test, expect } = require('dlest');

test.describe('E-commerce Flow', () => {
  test('product view tracking', async ({ page, dataLayer }) => {
    // Navigate to product page
    await page.goto('/product/123'); // Change to your product URL pattern
    
    // Verify view_item event with expected structure
    expect(dataLayer).toHaveEvent('view_item', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.arrayContaining([
        expect.objectContaining({
          item_id: expect.any(String),
          item_name: expect.any(String),
          category: expect.any(String),
          price: expect.any(Number)
        })
      ])
    });
  });
  
  test('add to cart tracking', async ({ page, dataLayer }) => {
    await page.goto('/product/123');
    
    // Click add to cart button
    await page.click('#add-to-cart'); // Change to your actual selector
    
    // Verify add_to_cart event
    expect(dataLayer).toHaveEvent('add_to_cart', {
      currency: 'USD', // Change to your currency
      value: expect.any(Number),
      items: expect.arrayContaining([
        expect.objectContaining({
          item_id: expect.any(String),
          item_name: expect.any(String),
          quantity: expect.any(Number)
        })
      ])
    });
  });
  
  test('remove from cart tracking', async ({ page, dataLayer }) => {
    await page.goto('/cart');
    
    // Remove item from cart
    await page.click('.remove-item'); // Change to your actual selector
    
    // Verify remove_from_cart event
    expect(dataLayer).toHaveEvent('remove_from_cart', {
      currency: 'USD',
      value: expect.any(Number),
      items: expect.arrayContaining([
        expect.objectContaining({
          item_id: expect.any(String)
        })
      ])
    });
  });
  
  test('checkout initiated tracking', async ({ page, dataLayer }) => {
    await page.goto('/cart');
    
    // Start checkout process
    await page.click('#checkout-button'); // Change to your actual selector
    
    // Verify begin_checkout event
    expect(dataLayer).toHaveEvent('begin_checkout', {
      currency: 'USD',
      value: expect.any(Number),
      items: expect.any(Array)
    });
  });
  
  test('purchase completion tracking', async ({ page, dataLayer }) => {
    // Navigate through purchase flow
    await page.goto('/product/123');
    await page.click('#add-to-cart');
    await page.click('#checkout-button');
    
    // Complete purchase
    await page.fill('#email', 'test@example.com');
    await page.fill('#card-number', '4242424242424242');
    await page.click('#complete-purchase');
    
    // Verify purchase event
    expect(dataLayer).toHaveEvent('purchase', {
      transaction_id: expect.any(String),
      currency: 'USD',
      value: expect.any(Number),
      items: expect.any(Array)
    });
  });
  
  test('complete e-commerce sequence', async ({ page, dataLayer }) => {
    // Test full funnel sequence
    await page.goto('/product/123');
    await page.click('#add-to-cart');
    await page.click('#checkout-button');
    await page.fill('#email', 'test@example.com');
    await page.click('#complete-purchase');
    
    // Verify event sequence
    expect(dataLayer).toHaveEventSequence([
      'view_item',
      'add_to_cart',
      'begin_checkout',
      'purchase'
    ]);
  });
  
  test('product search tracking', async ({ page, dataLayer }) => {
    await page.goto('/');
    
    // Perform search
    await page.fill('#search-input', 'test product');
    await page.click('#search-button');
    
    // Verify search event
    expect(dataLayer).toHaveEvent('search', {
      search_term: 'test product',
      results_count: expect.any(Number)
    });
  });
  
  test('product category view', async ({ page, dataLayer }) => {
    await page.goto('/category/electronics'); // Change to your category URL
    
    // Verify category view event
    expect(dataLayer).toHaveEvent('view_item_list', {
      item_list_name: expect.any(String),
      items: expect.any(Array)
    });
  });
});