---
sidebar_position: 7
title: Puppeteer Replay Support
description: Generate DLest tests from Puppeteer Replay recordings
---

# Puppeteer Replay Support

DLest agora suporta arquivos JSON do **Puppeteer Replay** em adição ao Chrome DevTools Recorder, permitindo que você crie testes de analytics a partir de gravações do Puppeteer.

## 📋 Visão Geral

O comando `dlest generate` detecta automaticamente o formato do seu recording (Chrome DevTools Recorder ou Puppeteer Replay) e gera testes DLest com as mesmas capacidades de detecção inteligente de eventos analytics.

### Formatos Suportados

| Formato | Descrição | Suporte |
|---------|-----------|---------|
| **Chrome DevTools Recorder** | JSON exportado do Chrome DevTools | ✅ Completo |
| **Puppeteer Replay** | JSON do formato Puppeteer Replay | ✅ Completo |

## 🚀 Quick Start

### 1. Criar Recording no Chrome DevTools

```bash
# 1. Abra o Chrome DevTools (F12)
# 2. Vá para a aba "Recorder"
# 3. Clique em "Create a new recording"
# 4. Nomeie sua gravação (ex: "Add to Cart Flow")
# 5. Clique em "Start recording"
# 6. Execute as ações que deseja testar
# 7. Clique em "End recording"
# 8. Exporte como JSON (pode ser Chrome ou Puppeteer format)
```

### 2. Gerar Teste DLest

```bash
# Preview do teste (sem criar arquivo)
npx dlest generate --from-recording recording.json --preview

# Gerar arquivo de teste
npx dlest generate --from-recording recording.json --output tests/my-flow.test.js

# Usar template específico para melhor detecção
npx dlest generate --from-recording recording.json --template ecommerce
```

### 3. Executar Teste

```bash
npx dlest tests/my-flow.test.js
```

## 🎯 Detecção Automática de Formato

O DLest detecta automaticamente qual formato você está usando:

```bash
npx dlest generate --from-recording recording.json --preview
```

Output:
```
📖 Reading recording from: recording.json
📋 Detected format: puppeteer-replay (confidence: high)
✅ Parsed 5 steps from recording
```

### Como Funciona

O detector analisa:
- **Estrutura de seletores**: Chrome usa arrays aninhados `[["selector"]]`, Puppeteer usa arrays simples `["selector"]`
- **Tipos de steps**: Puppeteer tem tipos específicos como `change`, `doubleClick`, `waitForExpression`
- **Campos de viewport**: Puppeteer inclui `deviceScaleFactor`, `isMobile`, etc.
- **assertedEvents**: Específico do Chrome Recorder

### Níveis de Confiança

- **High**: Identificação clara e inequívoca do formato
- **Medium**: Forte indicação mas não 100% certa
- **Low**: Formato ambíguo, usa Chrome Recorder como padrão

## 📊 Diferenças entre Formatos

### Estrutura de Seletores

**Chrome DevTools Recorder:**
```json
{
  "type": "click",
  "selectors": [
    ["#button"],
    [".btn"],
    ["button"]
  ]
}
```

**Puppeteer Replay:**
```json
{
  "type": "click",
  "selectors": ["#button", ".btn", "button"]
}
```

**Resultado no DLest:** Ambos são normalizados internamente e geram o mesmo teste.

### Tipos de Steps

| Step Type | Chrome Recorder | Puppeteer Replay | DLest Output |
|-----------|----------------|------------------|--------------|
| Input change | `fill` | `change` | `page.fill()` |
| Double-click | ❌ Não suportado | `doubleClick` | `page.dblclick()` |
| Viewport | `setViewport` | `setViewport` + extras | `page.setViewportSize()` |
| Wait expression | ❌ | `waitForExpression` | TODO comment |
| Browser close | ❌ | `close` | Ignorado |

### Viewport Settings

**Chrome DevTools Recorder:**
```json
{
  "type": "setViewport",
  "width": 1280,
  "height": 720
}
```

**Puppeteer Replay:**
```json
{
  "type": "setViewport",
  "width": 1280,
  "height": 720,
  "deviceScaleFactor": 2,
  "isMobile": false,
  "hasTouch": false,
  "isLandscape": false
}
```

**DLest**: Usa apenas `width` e `height`, mas adiciona comentário sobre campos extras.

## 🎨 Conversões Automáticas

### Change → Fill

```json
// Input Puppeteer
{
  "type": "change",
  "selectors": ["#email"],
  "value": "user@example.com"
}
```

```javascript
// Output DLest
await page.fill('#email', 'user@example.com');
```

### DoubleClick → Dblclick

```json
// Input Puppeteer
{
  "type": "doubleClick",
  "selectors": ["#element"]
}
```

```javascript
// Output DLest
await page.dblclick('#element');
// Double-click action
```

### WaitForExpression → TODO

```json
// Input Puppeteer
{
  "type": "waitForExpression",
  "expression": "window.dataLayer.length > 0"
}
```

```javascript
// Output DLest
// TODO: Implement waitForExpression - window.dataLayer.length > 0
// Puppeteer waitForExpression needs manual conversion
```

## 💡 Detecção de Analytics Events

A detecção de eventos analytics funciona **identicamente** para ambos os formatos:

### E-commerce Events

```javascript
// Detectado automaticamente de seletores
await page.click('[data-testid="add-to-cart"]');
// ↓
expect(dataLayer).toHaveEvent('add_to_cart', {
  currency: expect.any(String),
  value: expect.any(Number),
  items: expect.arrayContaining([...])
});
```

### Form Events

```javascript
// Detectado de form fills
await page.fill('#email', 'user@example.com');
// ↓
expect(dataLayer).toHaveEvent('form_interaction', {
  form_field: '#email',
  interaction_type: 'fill'
});
```

### Navigation Events

```javascript
// Detectado em todas as navegações
await page.goto('https://example.com/product/123');
// ↓
expect(dataLayer).toHaveEvent('page_view', {
  page_location: expect.any(String),
  page_title: expect.any(String)
});
```

## 📖 Exemplos Completos

### Exemplo 1: E-commerce Add to Cart

**Recording (Puppeteer Replay):**
```json
{
  "title": "E-commerce Add to Cart",
  "steps": [
    {
      "type": "navigate",
      "url": "https://shop.example.com/product/123"
    },
    {
      "type": "click",
      "selectors": ["[data-testid='add-to-cart']", ".add-btn"]
    },
    {
      "type": "change",
      "selectors": ["#quantity"],
      "value": "2"
    },
    {
      "type": "click",
      "selectors": ["#checkout"]
    }
  ]
}
```

**Comando:**
```bash
npx dlest generate \
  --from-recording ecommerce.json \
  --template ecommerce \
  --output tests/add-to-cart.test.js
```

**Teste Gerado:**
```javascript
const { test, expect } = require('dlest');

test.describe('E-commerce Add to Cart', () => {
  test('Generated from Recording', async ({ page, dataLayer }) => {
    // Navigate to product
    await page.goto('https://shop.example.com/product/123');
    await page.waitForTimeout(100);
    expect(dataLayer).toHaveEvent('page_view');
    expect(dataLayer).toHaveEvent('view_item', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.any(Array)
    });

    // Add to cart
    await page.click('[data-testid='add-to-cart']');
    await page.waitForTimeout(100);
    expect(dataLayer).toHaveEvent('add_to_cart', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.arrayContaining([...])
    });

    // Change quantity
    await page.fill('#quantity', '2');
    await page.waitForTimeout(100);
    expect(dataLayer).toHaveEvent('form_interaction');

    // Checkout
    await page.click('#checkout');
    await page.waitForTimeout(100);
    expect(dataLayer).toHaveEvent('begin_checkout');
  });
});
```

### Exemplo 2: Form Submission

**Recording (Puppeteer Replay):**
```json
{
  "title": "Contact Form",
  "steps": [
    {
      "type": "navigate",
      "url": "https://example.com/contact"
    },
    {
      "type": "change",
      "selectors": ["#name"],
      "value": "John Doe"
    },
    {
      "type": "change",
      "selectors": ["#email"],
      "value": "john@example.com"
    },
    {
      "type": "click",
      "selectors": ["[data-testid='submit']"]
    }
  ]
}
```

**Comando:**
```bash
npx dlest generate --from-recording contact-form.json --preview
```

**Preview Output:**
```
📋 Test Generation Preview
──────────────────────────────────────────────────
Title: Contact Form
Steps: 4
Events: 4
Journey: form (high)
Template: auto
Filename: contact-form-2026-02-02.test.js

📝 Steps Overview:
   1. Navigate to https://example.com/contact → page_view
   2. Fill #name with "John Doe" → form_interaction
   3. Fill #email with "john@example.com" → form_interaction
   4. Click [data-testid='submit'] → form_submit
```

## 🛠️ Opções Avançadas

### Template Selection

```bash
# Auto-detect template baseado no journey
npx dlest generate --from-recording recording.json

# Force specific template
npx dlest generate --from-recording recording.json --template ecommerce
npx dlest generate --from-recording recording.json --template form
npx dlest generate --from-recording recording.json --template basic
```

### Min Confidence Level

```bash
# Include apenas eventos com confiança high
npx dlest generate --from-recording recording.json --min-confidence high

# Include eventos medium e high
npx dlest generate --from-recording recording.json --min-confidence medium

# Include todos os eventos (padrão)
npx dlest generate --from-recording recording.json --min-confidence low
```

### Custom Test Name

```bash
npx dlest generate \
  --from-recording recording.json \
  --test-name "My Custom Test Name"
```

### Disable Comments/TODOs

```bash
# Gerar sem comentários
npx dlest generate --from-recording recording.json --no-comments

# Gerar sem TODOs
npx dlest generate --from-recording recording.json --no-todos
```

## 🔍 Debugging

### Verbose Mode

```bash
npx dlest generate --from-recording recording.json --verbose
```

Mostra:
- Formato detectado com detalhes
- Cada step processado
- Analytics events identificados
- Confiança de cada detecção

### Análise Detalhada de Formato

Você pode usar a API do FormatDetector diretamente:

```javascript
const { FormatDetector } = require('dlest/src/recorder/format-detector');
const recording = require('./recording.json');

const analysis = FormatDetector.analyzeDetailed(recording);
console.log(analysis);
```

Output:
```javascript
{
  format: 'puppeteer-replay',
  confidence: 'high',
  indicators: {
    chromeRecorder: 1,
    puppeteerReplay: 5,
    neutral: 0
  },
  selectorFormat: 'simple-array',
  stepsCount: 5,
  stepTypes: ['navigate', 'click', 'change', 'doubleClick']
}
```

## ⚡ Performance

- **Format Detection**: < 1ms
- **Parsing**: ~10-20ms por recording
- **Generation**: ~50-100ms para teste completo
- **Zero overhead**: Detecção não impacta geração

## 🔒 Limitações e Considerações

### Steps Não Suportados

Alguns steps do Puppeteer Replay não têm equivalente direto:

| Step | Status | Resultado |
|------|--------|-----------|
| `waitForExpression` | ⚠️ Parcial | Gera TODO comment |
| `emulateNetworkConditions` | ❌ | Ignorado |
| `close` | ❌ | Ignorado (não relevante) |
| `keyUp` | ⚠️ Parcial | Comment (incluído em press) |

### Recommendations

1. **Use seletores estáveis**: `data-testid`, IDs, aria-labels
2. **Evite seletores CSS complexos**: Podem quebrar com mudanças
3. **Review eventos gerados**: Ajuste expectativas conforme sua implementação
4. **Test incrementally**: Grave jornadas curtas e combine depois

## 🆘 Troubleshooting

### "Failed to detect recording format"

**Causa**: JSON malformado ou estrutura inválida

**Solução**:
```bash
# Valide seu JSON
cat recording.json | jq .

# Verifique estrutura mínima
{
  "title": "...",
  "steps": [...]
}
```

### "Recording must contain at least one step"

**Causa**: Array `steps` vazio

**Solução**: Certifique-se de gravar pelo menos uma ação no recorder.

### Events não detectados corretamente

**Causa**: Seletores genéricos ou falta de contexto

**Solução**:
```bash
# Use template específico
npx dlest generate --from-recording recording.json --template ecommerce

# Ou ajuste manualmente o teste gerado
```

### Seletores quebrando

**Causa**: Seletores auto-gerados pelo Chrome são frágeis

**Solução**: Use atributos `data-testid` no seu HTML:
```html
<button data-testid="add-to-cart">Add to Cart</button>
```

## 📚 Recursos Adicionais

- [Chrome DevTools Recorder Documentation](https://developer.chrome.com/docs/devtools/recorder/)
- [Puppeteer Replay Format](https://github.com/puppeteer/replay)
- [DLest Test Writing Guide](./writing-tests.md)
- [Analytics Matchers Reference](../api/matchers.md)

## 🤝 Contribuindo

Encontrou um caso de uso não suportado? [Abra uma issue](https://github.com/metricasboss/dlest/issues) ou contribua com um PR!

## 📝 Changelog

### v0.6.0 (Unreleased)
- ✨ Added Puppeteer Replay format support
- ✨ Automatic format detection
- ✨ 50+ new tests for format detection and parsing
- 📚 Complete documentation and examples
