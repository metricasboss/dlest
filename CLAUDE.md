# DLest

## Plan & Review
### Before starting work
- Always in plan mode to make a plan
- After get the plam, manke sure you Write the plan to .claude/tasks/TASK_NAME.md.
- The plan should be a detailed implementation plan and the reasoning behing thenm, as well as tasks broken down.
- if the task require external knowleged or certain package, alse research to get latest knowledge (Use task tool for research)
- Don't over plan it, always think MVP.
- Once you write the plan, firstly ask me to review it. Do not continue until I approve the plan

### White implementing
- You should update the plan as you work.
- After you complete tasks in the plan, you should update and append detailed descriptions of the changes you made, so following tasks can be easily hand over to other engineers

## Uso Estratégico de Agentes AI

### Visão Geral
O projeto possui uma coleção de agentes especializados em `.claude/agents/` que podem acelerar significativamente o desenvolvimento do DLest. Cada agente é expert em seu domínio e pode ser invocado via Task tool quando sua expertise é necessária.

### Agentes Principais para DLest

#### 1. **test-writer-fixer** (Essencial)
- **Quando usar**: SEMPRE após modificações de código
- **Especialidade**: Escrever testes abrangentes, corrigir testes quebrados, manter integridade da suite
- **Uso no DLest**: 
  - Criar testes para os matchers customizados (`toHaveEvent`, `toHaveEventCount`)
  - Testar a injeção do spy no dataLayer
  - Validar integração com Playwright
  - Garantir cobertura de testes para CLI commands
- **Trigger automático**: Após implementar features ou corrigir bugs

#### 2. **rapid-prototyper** (MVP e Features)
- **Quando usar**: Criar novos recursos ou protótipos rapidamente
- **Especialidade**: Scaffolding, integração de APIs, MVPs funcionais
- **Uso no DLest**:
  - Criar templates de teste para e-commerce
  - Implementar novas features como watch mode
  - Prototipar integrações (GitHub Actions, VS Code extension)
  - Adicionar suporte para novos frameworks de teste

#### 3. **api-tester** (Validação de Performance)
- **Quando usar**: Testar performance e confiabilidade das APIs
- **Especialidade**: Load testing, contract testing, performance profiling
- **Uso no DLest**:
  - Testar o desempenho do runner com múltiplos testes
  - Validar que o spy não impacta performance do site
  - Benchmark do tempo de execução dos testes
  - Stress test com grandes volumes de eventos

#### 4. **performance-benchmarker** (Otimização)
- **Quando usar**: Identificar e resolver gargalos de performance
- **Especialidade**: Profiling, otimização, métricas de performance
- **Uso no DLest**:
  - Garantir execução < 500ms por teste
  - Otimizar injeção e captura de eventos
  - Minimizar overhead do spy
  - Melhorar tempo de startup do CLI

#### 5. **frontend-developer** (Interface e UX)
- **Quando usar**: Desenvolver interfaces de usuário
- **Especialidade**: React, Vue, TypeScript, responsive design
- **Uso no DLest**:
  - Criar dashboard de coverage
  - Desenvolver reporter visual
  - Implementar UI para configuração
  - Criar extensão VS Code

#### 6. **trend-researcher** (Oportunidades de Mercado)
- **Quando usar**: Identificar tendências e validar features
- **Especialidade**: Análise de mercado, comportamento de usuário
- **Uso no DLest**:
  - Pesquisar necessidades de analytics testing
  - Identificar features mais requisitadas
  - Analisar competidores (Cypress, Jest)
  - Descobrir padrões de uso em GA4/GTM

### Workflow de Desenvolvimento com Agentes

#### Fase 1: Planejamento e Research
```markdown
1. Use trend-researcher para validar necessidades do mercado
2. Use rapid-prototyper para criar POC inicial
3. Documente decisões em .claude/tasks/
```

#### Fase 2: Implementação
```markdown
1. Use rapid-prototyper para scaffolding de features
2. Use frontend-developer para interfaces (se necessário)
3. Use test-writer-fixer SEMPRE após código novo
4. Atualize plano em .claude/tasks/ conforme progride
```

#### Fase 3: Otimização
```markdown
1. Use performance-benchmarker para identificar gargalos
2. Use api-tester para validar robustez
3. Use test-writer-fixer para garantir cobertura
```

#### Fase 4: Validação
```markdown
1. Use api-tester para stress testing
2. Use performance-benchmarker para métricas finais
3. Documente resultados e métricas
```

### Exemplos Práticos de Uso

#### Exemplo 1: Adicionar novo matcher
```bash
# Solicitar ao Claude Code:
"Preciso adicionar um matcher toHaveEventWithin(timeout, eventName) ao DLest"

# Claude irá:
1. Usar rapid-prototyper para criar estrutura do matcher
2. Usar test-writer-fixer para escrever testes completos
3. Usar performance-benchmarker para garantir performance
```

#### Exemplo 2: Implementar watch mode
```bash
# Solicitar:
"Implementar watch mode que re-executa testes quando arquivos mudam"

# Claude irá:
1. Usar rapid-prototyper para implementação inicial
2. Usar test-writer-fixer para criar testes
3. Usar performance-benchmarker para otimizar detecção de mudanças
```

#### Exemplo 3: Otimizar performance
```bash
# Solicitar:
"Os testes estão demorando muito, preciso otimizar"

# Claude irá:
1. Usar performance-benchmarker para profiling
2. Usar api-tester para identificar gargalos
3. Implementar otimizações
4. Usar test-writer-fixer para validar mudanças
```

### Comandos para Invocar Agentes

```bash
# Após modificar código (automático)
"Use test-writer-fixer agent para garantir que os testes passam"

# Para nova feature
"Use rapid-prototyper agent para criar [feature]"

# Para otimização
"Use performance-benchmarker agent para analisar performance"

# Para pesquisa
"Use trend-researcher agent para entender [tópico]"
```

### Métricas de Sucesso com Agentes

- **Cobertura de Testes**: > 90% com test-writer-fixer
- **Performance**: < 500ms/teste com performance-benchmarker
- **Time to MVP**: < 2 dias com rapid-prototyper
- **Bugs em Produção**: < 1% com api-tester
- **Velocidade de Desenvolvimento**: 2x com uso coordenado

### Notas Importantes

1. **Sempre use test-writer-fixer** após qualquer mudança de código
2. **Documente em .claude/tasks/** todas as decisões tomadas pelos agentes
3. **Use múltiplos agentes** em paralelo quando possível
4. **Confie na expertise** dos agentes em seus domínios
5. **Itere rapidamente** seguindo filosofia de 6-day sprints


## Project Overview

DLest is a JavaScript test runner specifically designed for testing data layer implementations. Think "Jest for your data layer" - it provides familiar testing syntax for validating analytics tracking in web applications. Built on top of Playwright, DLest allows developers to write unit tests for their analytics implementations and catch tracking bugs before they reach production.

## Problem Statement

Analytics tracking breaks constantly due to:
- Frontend changes that accidentally remove tracking elements
- Refactoring that changes event parameters or timing
- A/B tests that break conversion tracking
- Missing events due to JavaScript errors or timing issues
- No systematic way to test analytics like we test application code

Current solutions require manual QA or expensive monitoring tools that detect issues after they happen. DLest enables developers to write automated tests for their tracking implementation.

## Core Objectives

### Primary Goals
1. **Enable unit testing for data layer events** with Jest-like syntax
2. **Catch tracking regressions** in CI/CD pipeline before deployment
3. **Provide familiar developer experience** for testing analytics
4. **Support common e-commerce and form tracking patterns** out of the box
5. **Integrate seamlessly** with existing test suites and workflows

### Success Metrics
- 100+ developers using in production within 6 months
- 0% learning curve for developers familiar with Jest/Playwright
- Catch 90% of common tracking bugs before production
- <5 minute setup time for basic use cases

## Technical Architecture

### MVP Components

1. **CLI Runner**: Command-line interface for running tests
2. **Test Framework**: Jest-like API for writing data layer tests
3. **Browser Integration**: Playwright wrapper for browser automation
4. **Data Layer Spy**: JavaScript injection to capture data layer events
5. **Custom Matchers**: Assertions specifically for analytics events
6. **Config Management**: Configuration file system

### Technology Stack
- **Core**: Node.js with Playwright for browser automation
- **CLI**: Commander.js for command-line interface
- **Testing**: Jest-inspired API with custom matchers
- **Build**: Rollup for creating distributable package
- **Distribution**: NPM package with executable binary

## Implementation Strategy

### Phase 1: MVP Test Runner
- Basic CLI runner (`npx dlest`)
- Core matchers: `toHaveEvent()`, `toHaveEventData()`
- Playwright integration for browser automation
- Simple config file support
- Data layer spy injection

### Phase 2: Enhanced Features  
- Pre-built test templates for common scenarios
- Support for multiple browsers
- Coverage reporting
- Watch mode
- Better error messages and debugging

### Phase 3: Ecosystem Integration
- Jest plugin for existing test suites
- GitHub Actions integration
- Popular e-commerce platform presets
- VS Code extension for test writing

## Code Standards

### Test API Design
```javascript
// tests/tracking.test.js
const { test, expect } = require('dlest');

test('purchase event fires correctly', async ({ page, dataLayer }) => {
  await page.goto('/product/123');
  await page.click('#add-to-cart');
  await page.click('#checkout-button');
  
  expect(dataLayer).toHaveEvent('purchase', {
    transaction_id: expect.any(String),
    value: expect.any(Number),
    currency: 'BRL'
  });
});

test('form submission tracking', async ({ page, dataLayer }) => {
  await page.goto('/contact');
  await page.fill('#email', 'test@example.com');
  await page.click('#submit');
  
  expect(dataLayer).toHaveEvent('form_submit', {
    form_name: 'contact'
  });
});
```

### Project Structure
```
dlest/
├── src/
│   ├── cli/
│   │   ├── runner.js      # Main CLI runner
│   │   └── commands.js    # CLI commands (run, init, etc)
│   ├── core/
│   │   ├── test-runner.js # Core test execution
│   │   ├── browser.js     # Playwright wrapper
│   │   └── spy.js         # Data layer spy injection
│   ├── matchers/
│   │   ├── index.js       # All custom matchers
│   │   ├── toHaveEvent.js # Main event matcher
│   │   └── toHaveEventData.js # Data validation matcher
│   └── config/
│       ├── loader.js      # Config file loading
│       └── defaults.js    # Default configuration
├── bin/
│   └── dlest.js          # Executable entry point
├── templates/
│   ├── basic.js          # Basic test template
│   └── ecommerce.js      # E-commerce test template
└── package.json
```

## Key Features

### CLI Interface
```bash
# Initialize DLest in project
npx dlest init

# Run all tests
npx dlest

# Run specific test file
npx dlest tests/purchase.test.js

# Watch mode
npx dlest --watch

# Run with specific browser
npx dlest --browser=firefox

# Generate coverage report
npx dlest --coverage
```

### Configuration
```javascript
// dlest.config.js
module.exports = {
  // Base URL for tests
  baseURL: 'http://localhost:3000',
  
  // Browser settings
  browsers: ['chromium'], // chromium, firefox, webkit
  
  // Test settings
  timeout: 30000,
  testDir: './tests',
  testMatch: '**/*.test.js',
  
  // Data layer settings
  dataLayer: {
    variableName: 'dataLayer', // Custom data layer variable name
    waitTimeout: 5000,         // How long to wait for events
  },
  
  // Reporting
  reporter: 'default', // default, json, junit
  coverage: {
    enabled: false,
    events: ['purchase', 'add_to_cart'] // Track coverage for specific events
  }
};
```

### Custom Matchers
```javascript
// Core matchers
expect(dataLayer).toHaveEvent('purchase');
expect(dataLayer).toHaveEvent('purchase', { value: 99.90 });
expect(dataLayer).toHaveEventCount('page_view', 1);
expect(dataLayer).toHaveEventSequence(['page_view', 'add_to_cart', 'purchase']);

// Advanced matchers
expect(dataLayer).toHaveValidSchema('purchase', purchaseSchema);
expect(dataLayer).toHaveEventWithin(5000, 'purchase'); // Event fired within 5s
expect(dataLayer).not.toHaveEvent('error');
```

### Test Templates
```javascript
// Generate from template
npx dlest init --template=ecommerce

// Generated test file
const { test, expect } = require('dlest');

test.describe('E-commerce Flow', () => {
  test('product view tracking', async ({ page, dataLayer }) => {
    await page.goto('/product/[id]');
    
    expect(dataLayer).toHaveEvent('view_item', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.arrayContaining([
        expect.objectContaining({
          item_id: expect.any(String),
          item_name: expect.any(String)
        })
      ])
    });
  });
  
  test('add to cart tracking', async ({ page, dataLayer }) => {
    await page.goto('/product/[id]');
    await page.click('[data-testid="add-to-cart"]');
    
    expect(dataLayer).toHaveEvent('add_to_cart');
  });
});
```

## Implementation Details

### Data Layer Spy
```javascript
// src/core/spy.js - Injected into browser
function createDataLayerSpy() {
  // Store original dataLayer
  window.__dlest_original_dataLayer = window.dataLayer || [];
  window.__dlest_events = [];
  
  // Override push method
  const originalPush = window.dataLayer?.push || Array.prototype.push;
  
  function interceptPush(...args) {
    // Store for DLest
    window.__dlest_events.push(...args);
    
    // Call original implementation
    return originalPush.apply(window.dataLayer, args);
  }
  
  // Replace dataLayer with spy
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push = interceptPush;
  
  return window.__dlest_events;
}
```

### Test Runner Core
```javascript
// src/core/test-runner.js
const { chromium } = require('playwright');

class DLestRunner {
  constructor(config) {
    this.config = config;
  }
  
  async runTests(testFiles) {
    const browser = await chromium.launch();
    
    for (const testFile of testFiles) {
      await this.runTestFile(browser, testFile);
    }
    
    await browser.close();
  }
  
  async runTestFile(browser, testFile) {
    const page = await browser.newPage();
    
    // Inject data layer spy
    await page.addInitScript(createDataLayerSpy);
    
    // Provide page and dataLayer to tests
    const context = {
      page,
      dataLayer: new DataLayerProxy(page)
    };
    
    // Execute test file with context
    await this.executeTest(testFile, context);
    
    await page.close();
  }
}
```

## MVP Scope

### Must Have (Week 1-2)
- [x] Basic CLI runner (`npx dlest`)
- [x] Core matcher: `toHaveEvent(eventName, eventData?)`
- [x] Playwright integration with data layer spy
- [x] Simple config file support
- [x] NPM package structure

### Should Have (Week 3-4)
- [x] Additional matchers: `toHaveEventCount`, `toHaveEventSequence`
- [x] Better error messages and debugging output
- [x] Test templates for common patterns
- [x] Watch mode support
- [x] Multiple browser support

### Could Have (Future)
- [ ] Coverage reporting
- [ ] Jest plugin integration
- [ ] VS Code extension
- [ ] GitHub Actions template
- [ ] Performance impact measurement

## Success Criteria

### Technical Criteria
- Works with 90% of standard GTM/GA4 implementations
- <500ms test execution overhead per test
- Clear error messages that help developers debug
- Zero-config setup for basic use cases

### User Experience Criteria
- 5-minute setup from npm install to first passing test
- Familiar API for developers who know Jest
- Clear documentation with copy-paste examples
- Active community engagement and contributions

## Getting Started Guide

### Installation
```bash
npm install --save-dev dlest
```

### Initialize
```bash
npx dlest init
```

### First Test
```javascript
// tests/basic.test.js
const { test, expect } = require('dlest');

test('page view tracking works', async ({ page, dataLayer }) => {
  await page.goto('/');
  
  expect(dataLayer).toHaveEvent('page_view');
});
```

### Run Tests
```bash
npx dlest
```

---

## Development Philosophy

DLest should feel like a natural extension of existing JavaScript testing tools. Developers who know Jest should be able to start writing analytics tests immediately. The goal is to make testing analytics as normal as testing application logic.

Focus on the 80/20 rule: solve the most common tracking scenarios first, then expand based on user feedback. Prioritize developer experience over advanced features in the MVP.

## Git Workflow
- Use sempre convetional commits para o git

## Language Settings
- Fale comigo sempre em portugues
```