# Plano de Testes - Chrome Recorder Integration

## Visão Geral
Criar cobertura de testes abrangente para a nova funcionalidade de geração de testes a partir de gravações do Chrome DevTools Recorder. Esta funcionalidade inclui 3 componentes principais e integração CLI.

## Componentes a Testar

### 1. ChromeRecorderParser (src/recorder/parser.js)
**Responsabilidade**: Parse do JSON do Chrome Recorder para formato estruturado

**Testes Unitários Necessários**:
- ✅ Parse de JSON válido
- ✅ Validação de estrutura de recording
- ✅ Processamento de diferentes tipos de steps
- ✅ Extração de seletores (priorização data-testid > id > aria)
- ✅ Conversão para ações Playwright
- ✅ Identificação de pontos de analytics
- ✅ Handling de passos inválidos/não suportados
- ✅ Extração de metadados
- ✅ Handling de erros (JSON inválido, estrutura incorreta)

### 2. AnalyticsMapper (src/recorder/analytics-mapper.js)
**Responsabilidade**: Mapeamento inteligente de ações para eventos analytics

**Testes Unitários Necessários**:
- ✅ Identificação de tipo de journey (ecommerce, form, spa, etc.)
- ✅ Mapeamento de steps de navegação para page_view
- ✅ Detecção de patterns e-commerce (add_to_cart, checkout, purchase)
- ✅ Mapeamento de formulários
- ✅ Cálculo de confidence levels
- ✅ Análise de contexto (previous/next steps)
- ✅ Detecção baseada em aria labels e seletores
- ✅ Recomendação de templates
- ✅ Geração de summary de eventos

### 3. TestGenerator (src/recorder/test-generator.js)
**Responsabilidade**: Geração de código DLest funcional

**Testes Unitários Necessários**:
- ✅ Geração de código syntacticamente correto
- ✅ Formatação de expected data
- ✅ Seleção de templates
- ✅ Geração de imports e estrutura de teste
- ✅ Inclusão de comentários e TODOs
- ✅ Handling de diferentes confidence levels
- ✅ Geração de nomes de arquivo
- ✅ Sanitização de strings
- ✅ Preview mode
- ✅ Geração de sugestões

### 4. CLI Command Integration
**Responsabilidade**: Comando `generate` com opções

**Testes de Integração Necessários**:
- ✅ Comando `dlest generate --from-recording <file>`
- ✅ Opções: --preview, --output, --template, --min-confidence
- ✅ Handling de arquivo inexistente
- ✅ Validation de JSON inválido
- ✅ Criação de diretórios de output
- ✅ Overwrites e confirmações

## Casos de Teste por Tipo de Recording

### E-commerce Journey
- ✅ Product view → Add to cart → Checkout → Purchase
- ✅ Detecção de seletores e-commerce
- ✅ Mapeamento correto de eventos GA4/GTM
- ✅ Validation de dados esperados

### Form Interactions
- ✅ Fill fields → Submit form
- ✅ Multiple forms em uma página
- ✅ Validation errors
- ✅ Success/failure flows

### SPA Navigation
- ✅ Route changes
- ✅ Virtual page views
- ✅ Dynamic content loading
- ✅ Hash routing vs History API

### Complex Scenarios
- ✅ Multi-step checkout
- ✅ Modal interactions
- ✅ Ajax forms
- ✅ Shopping cart modifications

## Error Handling Tests

### Input Validation
- ✅ Empty recording file
- ✅ Malformed JSON
- ✅ Missing required fields
- ✅ Unsupported step types
- ✅ Invalid selectors

### Edge Cases
- ✅ Very long recordings (>100 steps)
- ✅ No analytics events detected
- ✅ All low confidence events
- ✅ Duplicate events
- ✅ Conflicting selectors

## Integration Tests

### End-to-End Flow
- ✅ Recording → Parse → Map → Generate → Valid Test Code
- ✅ Generated test executes successfully
- ✅ Generated assertions work correctly
- ✅ File output and structure

### Real Recording Tests
- ✅ Usar gravações reais de diferentes sites
- ✅ Testar com Chrome Recorder format variations
- ✅ Compatibility com diferentes versões

## Fixtures e Test Data

### Sample Recordings
- ✅ Ecommerce completo (view → add → checkout → purchase)
- ✅ Form simples (contact form)
- ✅ SPA navigation
- ✅ Mixed journey (nav + form + ecommerce)
- ✅ Edge cases (no events, invalid steps)

### Expected Outputs
- ✅ Generated test files for each scenario
- ✅ Validation que o código gerado é syntactically correct
- ✅ Assertions corretas baseadas no input

## Performance e Reliability

### Performance Tests
- ✅ Parse time para recordings grandes
- ✅ Memory usage com multiple recordings
- ✅ Concurrent processing

### Reliability Tests
- ✅ Consistent output para same input
- ✅ No false positives/negatives
- ✅ Graceful degradation

## Test Structure

```
tests/
├── unit/
│   ├── recorder/
│   │   ├── parser.test.js
│   │   ├── analytics-mapper.test.js
│   │   ├── test-generator.test.js
│   │   └── fixtures/
│   │       ├── sample-recordings/
│   │       ├── expected-outputs/
│   │       └── invalid-inputs/
├── integration/
│   ├── cli-generate.test.js
│   ├── end-to-end.test.js
│   └── real-recordings.test.js
└── fixtures/
    ├── recordings/
    │   ├── ecommerce-complete.json
    │   ├── form-simple.json
    │   ├── spa-navigation.json
    │   ├── mixed-journey.json
    │   └── edge-cases/
    └── expected-tests/
        ├── ecommerce-complete.test.js
        ├── form-simple.test.js
        └── spa-navigation.test.js
```

## Sucesso Criteria

### Cobertura de Código
- ✅ >95% line coverage nos 3 componentes principais
- ✅ >90% branch coverage
- ✅ 100% dos error paths testados

### Qualidade dos Testes
- ✅ Cada teste é independente e pode rodar isoladamente
- ✅ Testes são determinísticos (não flaky)
- ✅ Mocks apropriados para dependencies externas
- ✅ Assertions claras e meaningful

### Funcionalidade
- ✅ Generated tests executam sem errors
- ✅ Generated assertions detectam real analytics issues
- ✅ Different types of recordings são handled correctly
- ✅ Error messages são helpful e actionable

## Prioridades

### High Priority (MVP)
1. Unit tests para cada componente principal
2. Basic integration test (happy path)
3. Error handling para casos comuns
4. Sample recordings para test data

### Medium Priority
1. Performance tests
2. Complex scenario tests
3. Real recording compatibility
4. Edge case handling

### Low Priority
1. Stress testing
2. Concurrent processing
3. Memory optimization tests
4. Cross-platform compatibility

## Timeline

- **Semana 1**: Unit tests e fixtures básicos
- **Semana 2**: Integration tests e error handling
- **Semana 3**: Real recording tests e polish
- **Semana 4**: Performance e edge cases

## Implementation Notes

- Usar Jest como framework de testes (consistency com ecosystem)
- Fixtures organizados por tipo de recording
- Helper functions para criar test data
- Mock filesystem operations nos unit tests
- Use real filesystem apenas nos integration tests
- Validation que generated code é syntactically correct através de AST parsing