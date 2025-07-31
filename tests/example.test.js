// Para testes internos do DLest, as funções test, expect e describe 
// são disponibilizadas globalmente pelo test runner
test.describe('E-commerce Tracking', () => {
  test('product view tracking', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/test-page.html');
    
    expect(dataLayer).toHaveEvent('view_item', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.arrayContaining([
        expect.objectContaining({
          item_id: expect.any(String),
          item_name: expect.any(String)
        })
      ])
    });
  });
  
  test('add to cart tracking', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/test-page.html');
    await page.click('#add-to-cart');
    
    expect(dataLayer).toHaveEvent('add_to_cart', {
      currency: 'USD',
      value: 99.99,
      items: [{
        item_id: 'test-product',
        item_name: 'Test Product',
        quantity: 1
      }]
    });
  });
  
  test('purchase flow', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/test-page.html');
    await page.click('#add-to-cart');
    await page.click('#checkout');
    
    expect(dataLayer).toHaveEventSequence([
      'view_item',
      'add_to_cart', 
      'purchase'
    ]);
  });
});
