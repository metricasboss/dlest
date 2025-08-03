/**
 * Default test template for remote URL testing
 * 
 * This test runs when you use: npx dlest https://example.com
 */

test.describe('Remote Analytics Testing', () => {
  test('page view tracking', async ({ page, dataLayer }) => {
    // Navigate to the remote URL (baseURL is set from CLI)
    await page.goto('/');
    
    // Wait a bit for analytics to load
    await page.waitForTimeout(2000);
    
    // Check if any page view event was fired
    const events = await dataLayer.getEvents();
    const pageViewEvents = events.filter(e => 
      e.event === 'page_view' || 
      e.event === 'pageview' || 
      e.eventAction === 'page_view' ||
      (e['0'] === 'event' && e['1'] === 'page_view')
    );
    
    expect(pageViewEvents.length).toBeGreaterThan(0);
    
    if (pageViewEvents.length > 0) {
      console.log(`✅ Found ${pageViewEvents.length} page view event(s)`);
    }
  });
  
  test('GTM/GA initialization', async ({ page, dataLayer }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const events = await dataLayer.getEvents();
    
    // Check for GTM events
    const gtmEvents = events.filter(e => 
      e.event?.includes('gtm') || 
      e['gtm.start']
    );
    
    // Check for GA config
    const gaConfig = events.filter(e => 
      e['0'] === 'config' ||
      e.event === 'config'
    );
    
    const hasTracking = gtmEvents.length > 0 || gaConfig.length > 0 || events.length > 0;
    
    if (hasTracking) {
      console.log(`✅ Analytics tracking detected:`);
      console.log(`   - Total events: ${events.length}`);
      console.log(`   - GTM events: ${gtmEvents.length}`);
      console.log(`   - GA configs: ${gaConfig.length}`);
    } else {
      console.log(`⚠️  No analytics tracking detected`);
    }
    
    expect(hasTracking).toBeTruthy();
  });
  
  test('data layer structure', async ({ page, dataLayer }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Check if dataLayer exists and is properly structured
    const dataLayerInfo = await page.evaluate(() => {
      return {
        exists: typeof window.dataLayer !== 'undefined',
        isArray: Array.isArray(window.dataLayer),
        length: window.dataLayer ? window.dataLayer.length : 0,
        hasGTM: typeof window.google_tag_manager !== 'undefined',
        hasGA: typeof window.gtag !== 'undefined' || typeof window.ga !== 'undefined'
      };
    });
    
    console.log(`📊 DataLayer analysis:`);
    console.log(`   - DataLayer exists: ${dataLayerInfo.exists}`);
    console.log(`   - Is array: ${dataLayerInfo.isArray}`);
    console.log(`   - Events count: ${dataLayerInfo.length}`);
    console.log(`   - GTM loaded: ${dataLayerInfo.hasGTM}`);
    console.log(`   - GA loaded: ${dataLayerInfo.hasGA}`);
    
    expect(dataLayerInfo.exists).toBeTruthy();
  });
});