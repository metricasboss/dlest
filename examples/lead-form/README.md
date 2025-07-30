# Exemplo: Formulário de Lead

Este exemplo demonstra como usar o DLest para testar eventos de geração de leads em formulários web.

## 📋 O que este exemplo testa

- **Event tracking de página**: `page_view` ao carregar
- **Interações com formulário**: foco em campos e seleção de opções
- **Geração de lead**: evento `generate_lead` ao enviar formulário
- **Conversão**: evento `conversion` após envio bem-sucedido
- **Validação de dados**: estrutura e valores dos eventos
- **Sequência de eventos**: ordem correta dos eventos disparados

## 🚀 Como executar

### 1. Instalar o DLest (se ainda não instalou)
```bash
npm install -g dlest
```

### 2. Navegar até a pasta do exemplo
```bash
cd examples/lead-form
```

### 3. Executar os testes
```bash
# Executar com servidor local automático
dlest --serve

# Ou executar servidor separadamente
dlest serve --port 3000 &
dlest lead-form.test.js
```

### 4. Ver o formulário em ação
Abra http://localhost:3000/examples/lead-form/index.html no seu navegador para ver o formulário funcionando e os eventos sendo disparados em tempo real.

## 📊 Eventos rastreados

### 1. Page View
```javascript
{
  event: 'page_view',
  page_title: 'Exemplo DLest - Formulário de Lead',
  page_location: 'http://localhost:3000/examples/lead-form/index.html',
  timestamp: 1641234567890
}
```

### 2. Interações com Formulário
```javascript
// Ao focar em campo obrigatório
{
  event: 'form_interaction',
  interaction_type: 'field_focus',
  field_name: 'name' // ou 'email'
}

// Ao selecionar interesse
{
  event: 'form_interaction',
  interaction_type: 'interest_selected',
  selected_interest: 'analytics'
}
```

### 3. Geração de Lead
```javascript
{
  event: 'generate_lead',
  form_name: 'demo_request',
  lead_source: 'website',
  lead_type: 'demo_request',
  user_name: 'João Silva',
  user_email: 'joao@empresa.com',
  company: 'Empresa Teste LTDA',
  interest: 'analytics',
  message_length: 45,
  form_location: '/examples/lead-form/index.html',
  timestamp: 1641234567890,
  lead_value: 100 // 100 para analytics, 50 para outros
}
```

### 4. Conversão
```javascript
{
  event: 'conversion',
  conversion_type: 'lead_submitted',
  conversion_value: 100,
  currency: 'BRL'
}
```

## 🧪 Estrutura dos testes

O arquivo `lead-form.test.js` contém 8 testes que cobrem:

1. **Page view inicial** - Verifica se o evento de visualização é disparado
2. **Seleção de interesse** - Testa interação com dropdown
3. **Foco em campos** - Verifica tracking de foco nos campos nome e email
4. **Envio do formulário** - Testa o evento principal `generate_lead`
5. **Evento de conversão** - Verifica evento após envio bem-sucedido
6. **Interface do usuário** - Testa se mensagem de sucesso aparece
7. **Validação de campos** - Verifica campos obrigatórios
8. **Valor do lead** - Testa cálculo baseado no tipo de interesse
9. **Sequência completa** - Verifica ordem correta de todos os eventos

## 💡 Principais aprendizados

### Matchers utilizados:
- `toHaveEvent(eventName, eventData)` - Verifica evento específico
- `toHaveEventSequence([...events])` - Verifica sequência de eventos
- `expect.any(Number)` - Para timestamps e valores numéricos
- `expect.stringContaining(text)` - Para URLs e textos parciais

### Técnicas de teste:
- `dataLayer.clear()` - Limpa eventos anteriores
- `page.waitForTimeout()` - Aguarda eventos assíncronos
- `page.waitForSelector()` - Aguarda elementos aparecerem
- Combinação de testes de UI e tracking

### Cenários cobertos:
- ✅ Eventos de página
- ✅ Interações com formulário
- ✅ Envio de dados
- ✅ Validação de formulário
- ✅ Eventos de conversão
- ✅ Cálculo de valores
- ✅ Sequências de eventos

## 🎯 Adaptando para seu projeto

Para usar este exemplo como base:

1. **Ajuste os seletores**: Mude os IDs e classes para corresponder ao seu HTML
2. **Customize os eventos**: Adapte os nomes e estrutura dos eventos para seu GA4/GTM
3. **Modifique validações**: Ajuste as validações de dados conforme suas necessidades
4. **Adicione cenários**: Inclua casos específicos do seu formulário

## 📝 Arquivos

- `index.html` - Formulário de demonstração com tracking implementado
- `lead-form.test.js` - Suite completa de testes
- `README.md` - Esta documentação

Este exemplo serve como template para testar qualquer formulário de geração de leads em sua aplicação.