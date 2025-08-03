// Teste mais genérico para sites remotos
test.describe('Remote Site Analytics', () => {
  test('analytics tracking exists', async ({ page, dataLayer }) => {
    // Navegar para o site
    await page.goto('/');
    
    // Aguardar um pouco para analytics carregar
    await page.waitForTimeout(3000);
    
    // Capturar todos os eventos
    const events = await dataLayer.getEvents();
    console.log(`📊 Total de eventos capturados: ${events.length}`);
    
    // Verificar se tem algum tracking
    expect(events.length).toBeGreaterThan(0);
    
    // Mostrar tipos de eventos encontrados
    const eventTypes = [...new Set(events.map(e => e.event || e.eventAction || e['0'] || 'unknown'))];
    console.log(`📋 Tipos de eventos: ${eventTypes.join(', ')}`);
  });

  test('dataLayer structure', async ({ page, dataLayer }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Verificar estrutura do dataLayer
    const analysis = await page.evaluate(() => {
      return {
        hasDataLayer: typeof window.dataLayer !== 'undefined',
        isArray: Array.isArray(window.dataLayer),
        length: window.dataLayer ? window.dataLayer.length : 0,
        hasGTM: typeof window.google_tag_manager !== 'undefined',
        hasGA: typeof window.gtag !== 'undefined',
        hasGA4: typeof window.gtag === 'function'
      };
    });
    
    console.log('🔍 Análise do DataLayer:');
    console.log(`   - DataLayer existe: ${analysis.hasDataLayer}`);
    console.log(`   - É um array: ${analysis.isArray}`);
    console.log(`   - Quantidade de items: ${analysis.length}`);
    console.log(`   - GTM carregado: ${analysis.hasGTM}`);
    console.log(`   - GA/gtag presente: ${analysis.hasGA}`);
    
    expect(analysis.hasDataLayer).toBeTruthy();
  });
});