---
sidebar_position: 8
title: Puppeteer Replay (PT-BR)
description: Gerar testes DLest a partir de gravações Puppeteer Replay
---

# Suporte a Puppeteer Replay

DLest agora suporta arquivos JSON do **Puppeteer Replay** além do Chrome DevTools Recorder, permitindo que você crie testes de analytics a partir de gravações do Puppeteer.

## 📋 Visão Geral

O comando `dlest generate` detecta automaticamente o formato da sua gravação (Chrome DevTools Recorder ou Puppeteer Replay) e gera testes DLest com as mesmas capacidades de detecção inteligente de eventos analytics.

### Formatos Suportados

| Formato | Descrição | Suporte |
|---------|-----------|---------|
| **Chrome DevTools Recorder** | JSON exportado do Chrome DevTools | ✅ Completo |
| **Puppeteer Replay** | JSON do formato Puppeteer Replay | ✅ Completo |

## 🚀 Início Rápido

### 1. Gravar no Chrome DevTools

```bash
# 1. Abra o Chrome DevTools (F12)
# 2. Vá para a aba "Recorder"
# 3. Clique em "Create a new recording"
# 4. Nomeie sua gravação (ex: "Fluxo de Compra")
# 5. Clique em "Start recording"
# 6. Execute as ações que deseja testar
# 7. Clique em "End recording"
# 8. Exporte como JSON (pode ser Chrome ou Puppeteer)
```

### 2. Gerar Teste DLest

```bash
# Visualizar o teste antes de criar
npx dlest generate --from-recording gravacao.json --preview

# Gerar arquivo de teste
npx dlest generate --from-recording gravacao.json --output tests/meu-fluxo.test.js

# Usar template específico para melhor detecção
npx dlest generate --from-recording gravacao.json --template ecommerce
```

### 3. Executar Teste

```bash
npx dlest tests/meu-fluxo.test.js
```

## 🎯 Detecção Automática de Formato

O DLest detecta automaticamente qual formato você está usando:

```bash
npx dlest generate --from-recording gravacao.json --preview
```

Saída:
```
📖 Reading recording from: gravacao.json
📋 Detected format: puppeteer-replay (confidence: high)
✅ Parsed 5 steps from recording
```

### Como Funciona

O detector analisa:
- **Estrutura de seletores**: Chrome usa arrays aninhados `[["selector"]]`, Puppeteer usa arrays simples `["selector"]`
- **Tipos de passos**: Puppeteer tem tipos específicos como `change`, `doubleClick`, `waitForExpression`
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
    ["#botao"],
    [".btn"],
    ["button"]
  ]
}
```

**Puppeteer Replay:**
```json
{
  "type": "click",
  "selectors": ["#botao", ".btn", "button"]
}
```

**Resultado no DLest:** Ambos são normalizados internamente e geram o mesmo teste.

### Tipos de Passos

| Tipo de Passo | Chrome Recorder | Puppeteer Replay | Saída DLest |
|---------------|----------------|------------------|-------------|
| Mudar input | `fill` | `change` | `page.fill()` |
| Duplo clique | ❌ Não suportado | `doubleClick` | `page.dblclick()` |
| Viewport | `setViewport` | `setViewport` + extras | `page.setViewportSize()` |
| Wait expression | ❌ | `waitForExpression` | Comentário TODO |
| Fechar browser | ❌ | `close` | Ignorado |

## 🎨 Conversões Automáticas

### Change → Fill

```json
// Input Puppeteer
{
  "type": "change",
  "selectors": ["#email"],
  "value": "usuario@example.com"
}
```

```javascript
// Output DLest
await page.fill('#email', 'usuario@example.com');
```

### DoubleClick → Dblclick

```json
// Input Puppeteer
{
  "type": "doubleClick",
  "selectors": ["#elemento"]
}
```

```javascript
// Output DLest
await page.dblclick('#elemento');
// Double-click action
```

## 💡 Detecção de Eventos Analytics

A detecção de eventos analytics funciona **identicamente** para ambos os formatos:

### Eventos E-commerce

```javascript
// Detectado automaticamente dos seletores
await page.click('[data-testid="adicionar-ao-carrinho"]');
// ↓
expect(dataLayer).toHaveEvent('add_to_cart', {
  currency: expect.any(String),
  value: expect.any(Number),
  items: expect.arrayContaining([...])
});
```

### Eventos de Formulário

```javascript
// Detectado de preenchimentos
await page.fill('#email', 'usuario@example.com');
// ↓
expect(dataLayer).toHaveEvent('form_interaction', {
  form_field: '#email',
  interaction_type: 'fill'
});
```

### Eventos de Navegação

```javascript
// Detectado em todas as navegações
await page.goto('https://example.com/produto/123');
// ↓
expect(dataLayer).toHaveEvent('page_view', {
  page_location: expect.any(String),
  page_title: expect.any(String)
});
```

## 📖 Exemplo Completo: E-commerce

### Gravação (Puppeteer Replay)

```json
{
  "title": "Adicionar ao Carrinho",
  "steps": [
    {
      "type": "navigate",
      "url": "https://loja.example.com/produto/123"
    },
    {
      "type": "click",
      "selectors": ["[data-testid='add-to-cart']", ".btn-comprar"]
    },
    {
      "type": "change",
      "selectors": ["#quantidade"],
      "value": "2"
    },
    {
      "type": "click",
      "selectors": ["#finalizar-compra"]
    }
  ]
}
```

### Comando

```bash
npx dlest generate \
  --from-recording ecommerce.json \
  --template ecommerce \
  --output tests/adicionar-carrinho.test.js
```

### Teste Gerado

```javascript
const { test, expect } = require('dlest');

test.describe('Adicionar ao Carrinho', () => {
  test('Fluxo completo de compra', async ({ page, dataLayer }) => {
    // Navegar para produto
    await page.goto('https://loja.example.com/produto/123');
    await page.waitForTimeout(100);
    expect(dataLayer).toHaveEvent('page_view');
    expect(dataLayer).toHaveEvent('view_item', {
      currency: 'BRL',
      value: expect.any(Number),
      items: expect.any(Array)
    });

    // Adicionar ao carrinho
    await page.click('[data-testid='add-to-cart']');
    await page.waitForTimeout(100);
    expect(dataLayer).toHaveEvent('add_to_cart', {
      currency: 'BRL',
      value: expect.any(Number),
      items: expect.arrayContaining([...])
    });

    // Mudar quantidade
    await page.fill('#quantidade', '2');
    await page.waitForTimeout(100);
    expect(dataLayer).toHaveEvent('form_interaction');

    // Finalizar compra
    await page.click('#finalizar-compra');
    await page.waitForTimeout(100);
    expect(dataLayer).toHaveEvent('begin_checkout');
  });
});
```

## 🛠️ Opções Avançadas

### Seleção de Template

```bash
# Auto-detecta template baseado na jornada
npx dlest generate --from-recording gravacao.json

# Força template específico
npx dlest generate --from-recording gravacao.json --template ecommerce
npx dlest generate --from-recording gravacao.json --template form
npx dlest generate --from-recording gravacao.json --template basic
```

### Nível de Confiança Mínimo

```bash
# Incluir apenas eventos com confiança alta
npx dlest generate --from-recording gravacao.json --min-confidence high

# Incluir eventos médios e altos
npx dlest generate --from-recording gravacao.json --min-confidence medium

# Incluir todos os eventos (padrão)
npx dlest generate --from-recording gravacao.json --min-confidence low
```

### Nome Customizado do Teste

```bash
npx dlest generate \
  --from-recording gravacao.json \
  --test-name "Meu Teste Customizado"
```

## 🔍 Debug e Troubleshooting

### Modo Verbose

```bash
npx dlest generate --from-recording gravacao.json --verbose
```

Mostra:
- Formato detectado com detalhes
- Cada passo processado
- Eventos analytics identificados
- Confiança de cada detecção

### "Failed to detect recording format"

**Causa**: JSON malformado ou estrutura inválida

**Solução**:
```bash
# Valide seu JSON
cat gravacao.json | jq .

# Verifique estrutura mínima
{
  "title": "...",
  "steps": [...]
}
```

### Eventos não detectados corretamente

**Causa**: Seletores genéricos ou falta de contexto

**Solução**:
```bash
# Use template específico
npx dlest generate --from-recording gravacao.json --template ecommerce

# Ou ajuste manualmente o teste gerado
```

### Seletores quebrando

**Causa**: Seletores auto-gerados pelo Chrome são frágeis

**Solução**: Use atributos `data-testid` no seu HTML:
```html
<button data-testid="adicionar-ao-carrinho">Adicionar ao Carrinho</button>
```

## 💡 Boas Práticas

1. **Use seletores estáveis**: Prefira `data-testid`, IDs, aria-labels
2. **Grave jornadas curtas**: Mais fácil de manter e debugar
3. **Revise os eventos gerados**: Ajuste conforme sua implementação real
4. **Teste incrementalmente**: Grave e teste partes do fluxo separadamente
5. **Use templates apropriados**: `ecommerce` para lojas, `form` para formulários

## 📚 Recursos Adicionais

- [Documentação Chrome DevTools Recorder](https://developer.chrome.com/docs/devtools/recorder/)
- [Formato Puppeteer Replay](https://github.com/puppeteer/replay)
- [Guia de Escrita de Testes DLest](./writing-tests.md)
- [Referência de Matchers](../api/matchers.md)

## 🤝 Contribuindo

Encontrou um caso de uso não suportado? [Abra uma issue](https://github.com/metricasboss/dlest/issues) ou contribua com um PR!
