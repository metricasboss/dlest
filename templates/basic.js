/**
 * Basic DLest Template
 * 
 * Simple template for getting started with DLest
 */

const { test, expect } = require('dlest');

test('page view tracking', async ({ page, dataLayer }) => {
  // Navigate to your page
  await page.goto('/'); // Change this to your actual URL
  
  // Check that page view event was fired
  expect(dataLayer).toHaveEvent('page_view');
});

test('button click tracking', async ({ page, dataLayer }) => {
  await page.goto('/');
  
  // Click a tracked element
  await page.click('#your-button-selector'); // Change to your actual selector
  
  // Verify the expected event was fired
  expect(dataLayer).toHaveEvent('click', {
    element: 'button'
  });
});

test('form submission tracking', async ({ page, dataLayer }) => {
  await page.goto('/contact'); // Change to your form page
  
  // Fill and submit form
  await page.fill('#email', 'test@example.com');
  await page.click('#submit-button');
  
  // Verify form submission event
  expect(dataLayer).toHaveEvent('form_submit', {
    form_name: 'contact'
  });
});