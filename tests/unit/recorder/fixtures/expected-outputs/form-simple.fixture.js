/**
 * Auto-generated DLest test from Chrome DevTools Recording
 * Original title: Contact Form Submission
 * Generated on: 2024-01-01T00:00:00.000Z
 * Journey type: form (high confidence)
 * Steps: 6
 * Suggested events: 4
 * 
 * TODO: Review and adjust the expected data layer events below
 * TODO: Update selectors if they seem fragile
 * TODO: Add meaningful assertions based on your actual implementation
 */

const { test, expect } = require('dlest');

test.describe('Contact Form Submission', () => {
  test('should track analytics correctly', async ({ page, dataLayer }) => {
    // Generated from 6 recorded steps

    // Step 1: Navigate to https://example.com/contact
    await page.goto('https://example.com/contact');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('page_view', {
      page_location: expect.any(String),
      page_title: expect.any(String)
    });

    // Step 2: Set viewport to 1200x800
    await page.setViewportSize({ width: 1200, height: 800 });

    // Step 3: Fill #name with "John Doe"
    await page.fill('#name', 'John Doe');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('form_interaction', {
      form_field: '#name',
      interaction_type: 'fill'
    });

    // Step 4: Fill #email with "john@example.com"
    await page.fill('#email', 'john@example.com');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('form_interaction', {
      form_field: '#email',
      interaction_type: 'fill'
    });
    expect(dataLayer).toHaveEvent('email_input', {
      field_type: 'email'
    });

    // Step 5: Fill #message with "Hello, I would like to get in touch."
    await page.fill('#message', 'Hello, I would like to get in touch.');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('form_interaction', {
      form_field: '#message',
      interaction_type: 'fill'
    });

    // Step 6: Click aria/Enviar mensagem
    await page.click('aria/Enviar mensagem');
    await page.waitForTimeout(100); // Allow analytics to fire
    expect(dataLayer).toHaveEvent('form_submit', {
      form_name: expect.any(String)
    });
  });
});