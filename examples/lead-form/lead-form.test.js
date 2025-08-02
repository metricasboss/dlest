// Para o DLest, test, expect e describe são disponibilizados globalmente
test.describe('Formulário de Lead', () => {
  test('deve disparar evento page_view ao carregar a página', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/index.html');
    
    expect(dataLayer).toHaveEvent('page_view', {
      page_title: 'Exemplo DLest - Formulário de Lead',
      page_location: expect.stringContaining('/index.html'),
      timestamp: expect.any(Number)
    });
  });

  test('deve disparar evento form_interaction ao selecionar interesse', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/index.html');
    
    // Limpar eventos anteriores
    await dataLayer.clear();
    
    // Selecionar uma opção de interesse
    await page.selectOption('#interest', 'analytics');
    
    expect(dataLayer).toHaveEvent('form_interaction', {
      interaction_type: 'interest_selected',
      selected_interest: 'analytics'
    });
  });

  test('deve disparar evento form_interaction ao focar em campos obrigatórios', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/index.html');
    
    // Limpar eventos anteriores
    await dataLayer.clear();
    
    // Focar no campo nome
    await page.focus('#name');
    
    expect(dataLayer).toHaveEvent('form_interaction', {
      interaction_type: 'field_focus',
      field_name: 'name'
    });
    
    // Limpar e testar email
    await dataLayer.clear();
    await page.focus('#email');
    
    expect(dataLayer).toHaveEvent('form_interaction', {
      interaction_type: 'field_focus',
      field_name: 'email'
    });
  });

  test('deve disparar evento generate_lead ao enviar formulário', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/index.html');
    
    // Preencher formulário
    await page.fill('#name', 'João Silva');
    await page.fill('#email', 'joao@empresa.com');
    await page.fill('#company', 'Empresa Teste LTDA');
    await page.selectOption('#interest', 'analytics');
    await page.fill('#message', 'Gostaria de saber mais sobre as métricas disponíveis');
    
    // Limpar eventos anteriores para focar apenas no envio
    await dataLayer.clear();
    
    // Enviar formulário
    await page.click('button[type="submit"]');
    
    // Verificar evento generate_lead
    expect(dataLayer).toHaveEvent('generate_lead', {
      event: 'generate_lead',
      form_name: 'demo_request',
      lead_source: 'website',
      lead_type: 'demo_request',
      user_name: 'João Silva',
      user_email: 'joao@empresa.com',
      company: 'Empresa Teste LTDA',
      interest: 'analytics',
      message_length: expect.any(Number),
      form_location: expect.stringContaining('/index.html'),
      timestamp: expect.any(Number),
      lead_value: 100 // analytics tem valor 100
    });
  });

  test('deve disparar evento conversion após envio bem-sucedido', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/index.html');
    
    // Preencher formulário
    await page.fill('#name', 'Maria Santos');
    await page.fill('#email', 'maria@empresa.com');
    await page.selectOption('#interest', 'testing');
    
    // Enviar formulário
    await page.click('button[type="submit"]');
    
    // Aguardar o evento de conversão (ocorre após 1s)
    await page.waitForTimeout(1500);
    
    // Verificar evento conversion
    expect(dataLayer).toHaveEvent('conversion', {
      event: 'conversion',
      conversion_type: 'lead_submitted',
      conversion_value: 50, // testing tem valor 50
      currency: 'BRL'
    });
  });

  test('deve mostrar mensagem de sucesso após envio', async ({ page }) => {
    await page.goto('http://localhost:3000/index.html');
    
    // Preencher campos obrigatórios
    await page.fill('#name', 'Pedro Costa');
    await page.fill('#email', 'pedro@empresa.com');
    
    // Enviar formulário
    await page.click('button[type="submit"]');
    
    // Aguardar mensagem de sucesso aparecer
    await page.waitForSelector('#successMessage', { state: 'visible' });
    
    // Verificar se o formulário foi escondido
    expect(await page.isHidden('#leadForm')).toBeTruthy();
    
    // Verificar se a mensagem contém o texto esperado
    const successMessage = await page.textContent('#successMessage');
    expect(successMessage).toContain('Obrigado! Sua solicitação foi enviada com sucesso');
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('http://localhost:3000/index.html');
    
    // Tentar enviar formulário sem preencher campos obrigatórios
    await page.click('button[type="submit"]');
    
    // Verificar se o formulário não foi enviado
    expect(await page.isVisible('#leadForm')).toBeTruthy();
    expect(await page.isHidden('#successMessage')).toBeTruthy();
    
    // Verificar validação HTML5
    const nameField = page.locator('#name');
    expect(await nameField.evaluate(el => el.validity.valid)).toBeFalsy();
  });

  test('deve calcular valor do lead baseado no interesse selecionado', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/index.html');
    
    // Teste com interesse 'analytics' (valor alto)
    await page.fill('#name', 'Ana Oliveira');
    await page.fill('#email', 'ana@empresa.com');
    await page.selectOption('#interest', 'analytics');
    
    await dataLayer.clear();
    await page.click('button[type="submit"]');
    
    expect(dataLayer).toHaveEvent('generate_lead', {
      interest: 'analytics',
      lead_value: 100
    });
    
    // Aguardar e verificar conversão com valor correto
    await page.waitForTimeout(1500);
    expect(dataLayer).toHaveEvent('conversion', {
      conversion_value: 100
    });
  });

  test('deve trackear sequência completa de eventos', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/index.html');
    
    // Limpar eventos iniciais
    await dataLayer.clear();
    
    // Interagir com formulário
    await page.focus('#name');
    await page.fill('#name', 'Carlos Mendes');
    await page.focus('#email');
    await page.fill('#email', 'carlos@empresa.com');
    await page.selectOption('#interest', 'integration');
    await page.click('button[type="submit"]');
    
    // Aguardar eventos assíncronos
    await page.waitForTimeout(1500);
    
    // Verificar sequência de eventos
    expect(dataLayer).toHaveEventSequence([
      'form_interaction', // field_focus name
      'form_interaction', // field_focus email  
      'form_interaction', // interest_selected
      'generate_lead',
      'conversion'
    ]);
  });
});