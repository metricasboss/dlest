// Teste simples para debug
test('teste básico', async ({ page, dataLayer }) => {
  console.log('Iniciando teste básico');
  
  // Escutar logs do console
  page.on('console', msg => {
    console.log('Console do browser:', msg.text());
  });
  
  // Verificar se o spy está disponível
  const spyExists = await page.evaluate(() => {
    return {
      hasCreateSpy: typeof window.__dlest_createDataLayerSpy !== 'undefined',
      hasHelpers: typeof window.__dlest_helpers !== 'undefined',
      hasEvents: typeof window.__dlest_events !== 'undefined',
      dataLayerExists: typeof window.dataLayer !== 'undefined'
    };
  });
  console.log('Estado do spy antes de navegar:', spyExists);
  
  await page.goto('http://localhost:3000/fixtures/test-page.html');
  console.log('Página carregada');
  
  // Verificar novamente após navegação
  const spyAfterNav = await page.evaluate(() => {
    return {
      hasCreateSpy: typeof window.__dlest_createDataLayerSpy !== 'undefined',
      hasHelpers: typeof window.__dlest_helpers !== 'undefined',
      hasEvents: typeof window.__dlest_events !== 'undefined',
      dataLayerExists: typeof window.dataLayer !== 'undefined',
      dataLayerLength: window.dataLayer ? window.dataLayer.length : 0,
      eventsLength: window.__dlest_events ? window.__dlest_events.length : 0
    };
  });
  console.log('Estado do spy após navegar:', spyAfterNav);
  
  // Aguardar um pouco para garantir que eventos foram disparados
  await page.waitForTimeout(1000);
  
  // Verificar eventos diretamente no browser
  const browserEvents = await page.evaluate(() => {
    return window.__dlest_events || [];
  });
  console.log('Eventos do browser:', browserEvents);
  
  const events = await dataLayer.getEvents();
  console.log('Eventos via dataLayer proxy:', events);
  
  // Validação simples
  if (events.length > 0) {
    console.log('✓ Eventos encontrados');
  } else {
    throw new Error('Nenhum evento capturado');
  }
});