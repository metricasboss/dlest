const { ChromeRecorderParser } = require('../../src/recorder/parser');
const { AnalyticsMapper } = require('../../src/recorder/analytics-mapper');
const { TestGenerator } = require('../../src/recorder/test-generator');
const { Commands } = require('../../src/cli/commands');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('End-to-End Chrome Recorder Integration', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dlest-e2e-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('complete flow validation', () => {
    test('should process recording through entire pipeline', () => {
      // Sample Chrome Recorder JSON
      const recording = {
        title: 'E2E Test Recording',
        steps: [
          {
            type: 'navigate',
            url: 'https://e-commerce-example.com/product/laptop'
          },
          {
            type: 'setViewport',
            width: 1280,
            height: 720
          },
          {
            type: 'click',
            selectors: [
              ['aria/MacBook Pro M2'],
              ['[data-testid="product-title"]'],
              ['.product-name']
            ]
          },
          {
            type: 'click',
            selectors: [
              ['aria/Adicionar ao carrinho'],
              ['[data-testid="add-to-cart"]'],
              ['#add-to-cart-btn']
            ]
          },
          {
            type: 'waitForElement',
            selectors: [['.cart-notification']]
          },
          {
            type: 'click',
            selectors: [
              ['aria/Ir para o carrinho'],
              ['[data-testid="go-to-cart"]'],
              ['.cart-button']
            ]
          },
          {
            type: 'navigate',
            url: 'https://e-commerce-example.com/cart'
          },
          {
            type: 'click',
            selectors: [
              ['aria/Finalizar compra'],
              ['[data-testid="checkout"]'],
              ['#checkout-button']
            ]
          },
          {
            type: 'navigate',
            url: 'https://e-commerce-example.com/checkout'
          },
          {
            type: 'fill',
            selectors: [['#customer-email']],
            value: 'customer@example.com'
          },
          {
            type: 'fill',
            selectors: [['#card-number']],
            value: '4111111111111111'
          },
          {
            type: 'fill',
            selectors: [['#expiry']],
            value: '12/25'
          },
          {
            type: 'fill',
            selectors: [['#cvv']],
            value: '123'
          },
          {
            type: 'click',
            selectors: [
              ['aria/Finalizar compra'],
              ['[data-testid="complete-purchase"]'],
              ['#submit-payment']
            ]
          },
          {
            type: 'navigate',
            url: 'https://e-commerce-example.com/order-confirmation'
          }
        ]
      };

      // Step 1: Parse recording
      const parser = new ChromeRecorderParser();
      const parsedRecording = parser.parseRecording(recording);

      expect(parsedRecording.title).toBe('E2E Test Recording');
      expect(parsedRecording.processedSteps.length).toBeGreaterThan(10);
      expect(parsedRecording.metadata.domains).toContain('e-commerce-example.com');

      // Verify navigation steps were processed
      const navSteps = parsedRecording.processedSteps.filter(s => s.type === 'navigate');
      expect(navSteps.length).toBe(4);
      expect(navSteps[0].action).toContain("await page.goto('https://e-commerce-example.com/product/laptop');");

      // Verify click steps were processed
      const clickSteps = parsedRecording.processedSteps.filter(s => s.type === 'click');
      expect(clickSteps.length).toBeGreaterThan(3);

      // Verify form fills were processed
      const fillSteps = parsedRecording.processedSteps.filter(s => s.type === 'fill');
      expect(fillSteps.length).toBe(4);
      expect(fillSteps[0].text).toBe('customer@example.com');

      // Step 2: Map to analytics events
      const mapper = new AnalyticsMapper();
      const analyticsMapping = mapper.mapStepsToEvents(parsedRecording.processedSteps, parsedRecording.metadata);

      expect(analyticsMapping.journeyType.primary).toBe('ecommerce');
      expect(analyticsMapping.journeyType.confidence).toBe('high');
      expect(analyticsMapping.events.length).toBeGreaterThan(5);

      // Verify specific e-commerce events were detected
      const eventNames = analyticsMapping.events.flatMap(e => e.events.map(ev => ev.eventName));
      expect(eventNames).toContain('page_view');
      expect(eventNames).toContain('view_item');
      expect(eventNames).toContain('select_item');
      expect(eventNames).toContain('add_to_cart');
      expect(eventNames).toContain('begin_checkout');
      expect(eventNames).toContain('purchase');

      // Verify event confidence
      const highConfidenceEvents = analyticsMapping.events
        .flatMap(e => e.events)
        .filter(e => e.confidence === 'high');
      expect(highConfidenceEvents.length).toBeGreaterThan(3);

      // Step 3: Generate test code
      const testGenerator = new TestGenerator();
      const generatedTest = testGenerator.generateTest(parsedRecording, analyticsMapping);

      expect(generatedTest.testCode).toBeDefined();
      expect(generatedTest.metadata).toBeDefined();
      expect(generatedTest.suggestions).toBeDefined();
      expect(generatedTest.filename).toMatch(/e2e-test-recording-.*\\.test\\.js$/);

      // Verify generated test contains essential elements
      expect(generatedTest.testCode).toContain("const { test, expect } = require('dlest');");
      expect(generatedTest.testCode).toContain('test.describe(');
      expect(generatedTest.testCode).toContain('E2E Test Recording');
      expect(generatedTest.testCode).toContain('async ({ page, dataLayer })');

      // Verify navigation actions
      expect(generatedTest.testCode).toContain("await page.goto('https://e-commerce-example.com/product/laptop');");
      expect(generatedTest.testCode).toContain("await page.goto('https://e-commerce-example.com/checkout');");

      // Verify click actions
      expect(generatedTest.testCode).toContain("await page.click('[data-testid=\"add-to-cart\"]');");
      expect(generatedTest.testCode).toContain("await page.click('[data-testid=\"checkout\"]');");

      // Verify form fills
      expect(generatedTest.testCode).toContain("await page.fill('#customer-email', 'customer@example.com');");
      expect(generatedTest.testCode).toContain("await page.fill('#card-number', '4111111111111111');");

      // Verify analytics assertions
      expect(generatedTest.testCode).toContain("expect(dataLayer).toHaveEvent('page_view'");
      expect(generatedTest.testCode).toContain("expect(dataLayer).toHaveEvent('view_item'");
      expect(generatedTest.testCode).toContain("expect(dataLayer).toHaveEvent('add_to_cart'");
      expect(generatedTest.testCode).toContain("expect(dataLayer).toHaveEvent('purchase'");

      // Verify expected data structures
      expect(generatedTest.testCode).toContain('currency');
      expect(generatedTest.testCode).toContain('value');
      expect(generatedTest.testCode).toContain('items');
      expect(generatedTest.testCode).toContain('transaction_id');

      // Verify metadata
      expect(generatedTest.metadata.journeyType).toBe('ecommerce');
      expect(generatedTest.metadata.stepsCount).toBeGreaterThan(10);
      expect(generatedTest.metadata.eventsCount).toBeGreaterThan(5);

      // Step 4: Validate generated code is syntactically correct
      expect(() => {
        // This would normally use eval, but we'll do basic syntax checks
        const hasRequire = generatedTest.testCode.includes("require('dlest')");
        const hasTestDescribe = generatedTest.testCode.includes('test.describe');
        const hasAsyncFunction = generatedTest.testCode.includes('async ({ page, dataLayer })');
        const hasExpectations = generatedTest.testCode.includes('expect(dataLayer)');
        
        expect(hasRequire).toBe(true);
        expect(hasTestDescribe).toBe(true);
        expect(hasAsyncFunction).toBe(true);
        expect(hasExpectations).toBe(true);
      }).not.toThrow();
    });

    test('should handle form-focused recording end-to-end', () => {
      const formRecording = {
        title: 'Lead Generation Form',
        steps: [
          {
            type: 'navigate',
            url: 'https://marketing-site.com/contact'
          },
          {
            type: 'setViewport',
            width: 1200,
            height: 800
          },
          {
            type: 'fill',
            selectors: [['#first-name']],
            value: 'Jane'
          },
          {
            type: 'fill',
            selectors: [['#last-name']],
            value: 'Smith'
          },
          {
            type: 'fill',
            selectors: [['#email']],
            value: 'jane.smith@company.com'
          },
          {
            type: 'fill',
            selectors: [['#company']],
            value: 'Acme Corp'
          },
          {
            type: 'fill',
            selectors: [['#phone']],
            value: '+1-555-123-4567'
          },
          {
            type: 'click',
            selectors: [['#newsletter-opt-in']]
          },
          {
            type: 'fill',
            selectors: [['#message']],
            value: 'Interested in your enterprise solution. Please contact me.'
          },
          {
            type: 'click',
            selectors: [
              ['aria/Submit Form'],
              ['[data-testid="submit-form"]'],
              ['button[type="submit"]']
            ]
          }
        ]
      };

      // Process through entire pipeline
      const parser = new ChromeRecorderParser();
      const parsedRecording = parser.parseRecording(formRecording);

      const mapper = new AnalyticsMapper();
      const analyticsMapping = mapper.mapStepsToEvents(parsedRecording.processedSteps, parsedRecording.metadata);

      const testGenerator = new TestGenerator();
      const generatedTest = testGenerator.generateTest(parsedRecording, analyticsMapping);

      // Verify form journey detection
      expect(analyticsMapping.journeyType.primary).toBe('form');
      expect(analyticsMapping.summary.recommendedTemplate).toBe('form');

      // Verify form-specific events
      const eventNames = analyticsMapping.events.flatMap(e => e.events.map(ev => ev.eventName));
      expect(eventNames).toContain('page_view');
      expect(eventNames).toContain('form_interaction');
      expect(eventNames).toContain('email_input');
      expect(eventNames).toContain('form_submit');

      // Verify generated test preserves form data
      expect(generatedTest.testCode).toContain('jane.smith@company.com');
      expect(generatedTest.testCode).toContain('Acme Corp');
      expect(generatedTest.testCode).toContain('Interested in your enterprise solution');

      // Verify form-specific assertions
      expect(generatedTest.testCode).toContain("expect(dataLayer).toHaveEvent('form_submit'");
      expect(generatedTest.testCode).toContain("expect(dataLayer).toHaveEvent('email_input'");
    });

    test('should handle SPA navigation end-to-end', () => {
      const spaRecording = {
        title: 'SPA Multi-Page Navigation',
        steps: [
          {
            type: 'navigate',
            url: 'https://spa-app.com/'
          },
          {
            type: 'click',
            selectors: [
              ['aria/Products'],
              ['[data-route="/products"]'],
              ['nav a[href="/products"]']
            ]
          },
          {
            type: 'waitForElement',
            selectors: [['.products-container']]
          },
          {
            type: 'click',
            selectors: [
              ['aria/Category: Electronics'],
              ['[data-category="electronics"]'],
              ['.category-filter']
            ]
          },
          {
            type: 'click',
            selectors: [
              ['aria/About Us'],
              ['[data-route="/about"]'],
              ['a[href="/about"]']
            ]
          },
          {
            type: 'waitForElement',
            selectors: [['.about-content']]
          },
          {
            type: 'click',
            selectors: [
              ['aria/Team'],
              ['[data-route="/about/team"]'],
              ['a[href="/about/team"]']
            ]
          },
          {
            type: 'click',
            selectors: [
              ['aria/Contact'],
              ['[data-route="/contact"]'],
              ['.footer a[href="/contact"]']
            ]
          }
        ]
      };

      // Process through pipeline
      const parser = new ChromeRecorderParser();
      const parsedRecording = parser.parseRecording(spaRecording);

      const mapper = new AnalyticsMapper();
      const analyticsMapping = mapper.mapStepsToEvents(parsedRecording.processedSteps, parsedRecording.metadata);

      const testGenerator = new TestGenerator();
      const generatedTest = testGenerator.generateTest(parsedRecording, analyticsMapping);

      // Verify SPA/navigation journey
      expect(analyticsMapping.journeyType.primary).toBe('navigation');

      // Should detect multiple page views for route changes
      const pageViewEvents = analyticsMapping.events
        .flatMap(e => e.events)
        .filter(e => e.eventName === 'page_view');
      expect(pageViewEvents.length).toBeGreaterThan(0);

      // Verify route handling in generated test
      expect(generatedTest.testCode).toContain('[data-route="/products"]');
      expect(generatedTest.testCode).toContain('[data-route="/about"]');
      expect(generatedTest.testCode).toContain('[data-route="/contact"]');

      // Should include wait statements for SPA routing
      expect(generatedTest.testCode).toContain('waitForElement');
    });
  });

  describe('CLI integration validation', async () => {
    test('should work through CLI commands interface', async () => {
      const recording = {
        title: 'CLI Integration Test',
        steps: [
          {
            type: 'navigate',
            url: 'https://test-app.com/signup'
          },
          {
            type: 'fill',
            selectors: [['#email']],
            value: 'test@example.com'
          },
          {
            type: 'fill',
            selectors: [['#password']],
            value: 'securepassword123'
          },
          {
            type: 'click',
            selectors: [['button[type="submit"]']]
          }
        ]
      };

      // Write recording to temp file
      const recordingPath = path.join(tempDir, 'cli-test.json');
      fs.writeFileSync(recordingPath, JSON.stringify(recording, null, 2));

      const outputPath = path.join(tempDir, 'generated-cli-test.test.js');

      // Use CLI commands interface
      const commands = new Commands();
      const result = await commands.generate({
        fromRecording: recordingPath,
        output: outputPath,
        template: 'form',
        includeComments: true,
        includeTodos: true
      });

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);

      // Verify generated file
      const generatedContent = fs.readFileSync(outputPath, 'utf8');
      expect(generatedContent).toContain('CLI Integration Test');
      expect(generatedContent).toContain("await page.goto('https://test-app.com/signup');");
      expect(generatedContent).toContain("await page.fill('#email', 'test@example.com');");
      expect(generatedContent).toContain("expect(dataLayer).toHaveEvent('form_submit'");

      // Verify metadata
      expect(result.metadata.originalTitle).toBe('CLI Integration Test');
      expect(result.metadata.journeyType).toBe('form');
    });
  });

  describe('error resilience validation', () => {
    test('should gracefully handle recordings with mixed quality', () => {
      const mixedQualityRecording = {
        title: 'Mixed Quality Recording',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com'
          },
          {
            type: 'click',
            selectors: [['#good-selector']]
          },
          {
            type: 'click',
            // Missing selectors
          },
          {
            type: 'fill',
            selectors: [[]],  // Empty selectors
            value: 'test value'
          },
          {
            type: 'unknown_type',
            data: 'unknown step type'
          },
          {
            type: 'click',
            selectors: [['#final-button']]
          }
        ]
      };

      const parser = new ChromeRecorderParser();
      const parsedRecording = parser.parseRecording(mixedQualityRecording);

      // Should filter out invalid steps but keep valid ones
      expect(parsedRecording.processedSteps.length).toBeGreaterThan(0);
      expect(parsedRecording.processedSteps.length).toBeLessThan(mixedQualityRecording.steps.length);

      // Should still proceed with analytics mapping
      const mapper = new AnalyticsMapper();
      const analyticsMapping = mapper.mapStepsToEvents(parsedRecording.processedSteps, parsedRecording.metadata);

      expect(analyticsMapping.events).toBeDefined();
      expect(Array.isArray(analyticsMapping.events)).toBe(true);

      // Should still generate test code
      const testGenerator = new TestGenerator();
      const generatedTest = testGenerator.generateTest(parsedRecording, analyticsMapping);

      expect(generatedTest.testCode).toBeDefined();
      expect(generatedTest.testCode).toContain("const { test, expect } = require('dlest');");
      expect(generatedTest.testCode).toContain('Mixed Quality Recording');
    });

    test('should handle empty analytics mapping gracefully', () => {
      const minimalRecording = {
        title: 'Minimal Recording',
        steps: [
          {
            type: 'setViewport',
            width: 1280,
            height: 720
          }
        ]
      };

      const parser = new ChromeRecorderParser();
      const parsedRecording = parser.parseRecording(minimalRecording);

      const mapper = new AnalyticsMapper();
      const analyticsMapping = mapper.mapStepsToEvents(parsedRecording.processedSteps, parsedRecording.metadata);

      // Should handle case with no analytics events
      expect(analyticsMapping.summary.totalEvents).toBe(0);

      const testGenerator = new TestGenerator();
      const generatedTest = testGenerator.generateTest(parsedRecording, analyticsMapping);

      // Should still generate valid test structure
      expect(generatedTest.testCode).toContain('test.describe');
      expect(generatedTest.testCode).toContain('Minimal Recording');
    });
  });

  describe('performance and scalability', () => {
    test('should handle large recordings efficiently', () => {
      const startTime = Date.now();

      // Generate large recording (100 steps)
      const largeRecording = {
        title: 'Large Scale Recording',
        steps: Array.from({ length: 100 }, (_, i) => ({
          type: i % 3 === 0 ? 'navigate' : i % 3 === 1 ? 'click' : 'fill',
          url: i % 3 === 0 ? `https://example.com/page-${i}` : undefined,
          selectors: i % 3 !== 0 ? [[`#element-${i}`]] : undefined,
          value: i % 3 === 2 ? `value-${i}` : undefined
        }))
      };

      const parser = new ChromeRecorderParser();
      const parsedRecording = parser.parseRecording(largeRecording);

      const mapper = new AnalyticsMapper();
      const analyticsMapping = mapper.mapStepsToEvents(parsedRecording.processedSteps, parsedRecording.metadata);

      const testGenerator = new TestGenerator();
      const generatedTest = testGenerator.generateTest(parsedRecording, analyticsMapping);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should process within reasonable time (less than 5 seconds)
      expect(processingTime).toBeLessThan(5000);

      // Should handle all steps
      expect(parsedRecording.processedSteps.length).toBe(100);
      expect(generatedTest.testCode).toContain('Large Scale Recording');
      expect(generatedTest.testCode.length).toBeGreaterThan(1000);
    });
  });

  describe('output quality validation', () => {
    test('should generate semantically meaningful test names and descriptions', () => {
      const recording = {
        title: 'User Registration and Email Verification Flow',
        steps: [
          {
            type: 'navigate',
            url: 'https://app.com/register'
          },
          {
            type: 'fill',
            selectors: [['#username']],
            value: 'newuser123'
          },
          {
            type: 'fill',
            selectors: [['#email']],
            value: 'newuser@example.com'
          },
          {
            type: 'fill',
            selectors: [['#password']],
            value: 'SecurePass123!'
          },
          {
            type: 'click',
            selectors: [['#register-button']]
          }
        ]
      };

      const parser = new ChromeRecorderParser();
      const parsedRecording = parser.parseRecording(recording);

      const mapper = new AnalyticsMapper();
      const analyticsMapping = mapper.mapStepsToEvents(parsedRecording.processedSteps, parsedRecording.metadata);

      const testGenerator = new TestGenerator();
      const generatedTest = testGenerator.generateTest(parsedRecording, analyticsMapping);

      // Should have meaningful test structure
      expect(generatedTest.testCode).toContain('User Registration and Email Verification Flow');
      
      // Should include contextual comments
      expect(generatedTest.testCode).toContain('// Step 1: Navigate to');
      expect(generatedTest.testCode).toContain('// Step 2: Fill');
      
      // Should preserve meaningful data
      expect(generatedTest.testCode).toContain('newuser@example.com');
      
      // Should generate appropriate filename
      expect(generatedTest.filename).toMatch(/user-registration-and-email-verification-flow-.*\\.test\\.js$/);
    });
  });
});