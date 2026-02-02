# DLest Documentation

Documentação completa do DLest - Test runner para analytics tracking.

## 📚 Guias

### Getting Started
- [Installation & Quick Start](../README.md#quick-start) - Instalação e primeiros passos
- [Writing Tests](guides/writing-tests.md) - Como escrever testes de analytics (se existir)

### Features
- **[Puppeteer Replay Support](guides/puppeteer-replay.md)** - Gerar testes a partir de gravações Puppeteer Replay
- **[Puppeteer Replay (PT-BR)](guides/puppeteer-replay-pt-br.md)** - Guia em português para Puppeteer Replay
- **[Network Validation](network-validation.md)** - Validação de requisições GA4 reais
- **[Cloud Export](EXPORT.md)** - Exportar resultados para S3/GCS

## 🎯 Use Cases

### E-commerce Testing
```bash
# Gerar teste de fluxo de compra
npx dlest generate --from-recording purchase-flow.json --template ecommerce
```

### Form Testing
```bash
# Gerar teste de formulário
npx dlest generate --from-recording contact-form.json --template form
```

### Remote Testing
```bash
# Testar site em produção
npx dlest https://production.example.com --ci
```

## 🔧 Configuration

### dlest.config.js
```javascript
module.exports = {
  baseURL: 'http://localhost:3000',
  browsers: ['chromium'],
  headless: true,
  timeout: 30000,
  testDir: './tests',
  testMatch: ['**/*.test.js'],

  dataLayer: {
    variableName: 'dataLayer',
    waitTimeout: 5000,
  },

  // Cloud export (opcional)
  export: {
    enabled: true,
    provider: 's3',
    bucket: 'my-analytics-tests'
  }
};
```

## 📖 API Reference

### Test API
```javascript
const { test, expect } = require('dlest');

test('my test', async ({ page, dataLayer, network }) => {
  // page: Playwright page object
  // dataLayer: Data layer spy with custom matchers
  // network: Network request interceptor
});
```

### Custom Matchers

#### Data Layer Matchers
- `toHaveEvent(eventName, expectedData?)` - Verifica evento no dataLayer
- `toHaveEventCount(eventName, count)` - Verifica quantidade de eventos
- `toHaveEventSequence(eventNames[])` - Verifica sequência de eventos

#### Network Matchers
- `toHaveGA4Event(eventName, expectedData?)` - Verifica requisição GA4 real
- `network.getGA4Events()` - Retorna todos eventos GA4
- `network.getGA4EventsByName(name)` - Filtra eventos por nome

### Jest-Compatible Matchers
- `toBe(expected)` - Igualdade estrita
- `toEqual(expected)` - Igualdade profunda
- `toContain(expected)` - Substring/array element
- `toMatch(regex)` - Regex matching
- `toHaveLength(length)` - Array/string length
- `toHaveProperty(key, value?)` - Object property
- `toBeGreaterThan(number)` / `toBeLessThan(number)` - Comparações
- `toThrow(error?)` - Exception validation

## 🚀 CLI Commands

```bash
# Run tests
npx dlest
npx dlest tests/specific.test.js
npx dlest --browser=firefox
npx dlest --verbose

# Initialize project
npx dlest init
npx dlest init --template=ecommerce

# Generate from recording
npx dlest generate --from-recording recording.json
npx dlest generate --from-recording recording.json --preview
npx dlest generate --from-recording recording.json --output tests/my-test.test.js

# Development server
npx dlest serve
npx dlest serve --port 8080

# Remote testing
npx dlest https://staging.example.com
npx dlest https://example.com --auth-user=admin --auth-pass=senha
```

## 🧪 Testing Strategies

### Unit Tests
Test individual analytics events in isolation:
```javascript
test('page view event', async ({ page, dataLayer }) => {
  await page.goto('/');
  expect(dataLayer).toHaveEvent('page_view');
});
```

### Integration Tests
Test complete user journeys:
```javascript
test('purchase flow', async ({ page, dataLayer }) => {
  await page.goto('/product/123');
  await page.click('#add-to-cart');
  await page.click('#checkout');

  expect(dataLayer).toHaveEventSequence([
    'view_item',
    'add_to_cart',
    'begin_checkout'
  ]);
});
```

### Network Validation
Validate actual GA4 requests:
```javascript
test('GA4 purchase event', async ({ page, network }) => {
  await page.click('#purchase');

  await expect(network).toHaveGA4Event('purchase', {
    transaction_id: expect.any(String),
    value: 99.90
  });
});
```

## 📊 CI/CD Integration

### GitHub Actions
```yaml
name: Analytics Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npx dlest install
      - run: npx dlest --ci
```

### GitLab CI
```yaml
analytics-tests:
  image: node:18
  script:
    - npm install
    - npx dlest install
    - npx dlest --ci
```

## 🔗 Links Úteis

- [GitHub Repository](https://github.com/metricasboss/dlest)
- [npm Package](https://www.npmjs.com/package/dlest)
- [GitHub Pages Docs](https://metricasboss.github.io/dlest/)
- [Issues & Feature Requests](https://github.com/metricasboss/dlest/issues)
- [MetricasBoss Blog](https://metricasboss.com/blog)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](../LICENSE) for details.
