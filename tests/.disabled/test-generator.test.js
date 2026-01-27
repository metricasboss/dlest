const { TestGenerator } = require('../../../src/recorder/test-generator');

describe('TestGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new TestGenerator();
  });

  // Sample data for testing
  const sampleParsedRecording = {
    title: 'Test Recording',
    processedSteps: [
      {
        id: 'step_0',
        type: 'navigate',
        url: 'https://example.com',
        action: "await page.goto('https://example.com');"
      },
      {
        id: 'step_1',
        type: 'click',
        selector: '#button',
        action: "await page.click('#button');"
      }
    ],
    metadata: {
      domains: ['example.com']
    }
  };

  const sampleAnalyticsMapping = {
    journeyType: {
      primary: 'basic',
      confidence: 'medium'
    },
    events: [
      {
        stepId: 'step_0',
        stepType: 'navigate',
        events: [
          {
            eventName: 'page_view',
            confidence: 'high',
            reason: 'Navigation always triggers page view',
            expectedData: {
              page_location: 'expect.any(String)',
              page_title: 'expect.any(String)'
            }
          }
        ]
      },
      {
        stepId: 'step_1',
        stepType: 'click',
        events: [
          {
            eventName: 'click',
            confidence: 'medium',
            reason: 'Button click interaction',
            expectedData: {
              element_type: "'button'",
              element_selector: "'#button'"
            }
          }
        ]
      }
    ],
    summary: {
      totalEvents: 2,
      highConfidenceEvents: 1,
      recommendedTemplate: 'basic',
      eventTypes: ['page_view', 'click'],
      eventCounts: { page_view: 1, click: 1 }
    }
  };

  describe('generateTest', () => {
    test('should generate complete test structure', () => {
      const result = generator.generateTest(sampleParsedRecording, sampleAnalyticsMapping);

      expect(result).toHaveProperty('testCode');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('filename');

      // Test code should be a string
      expect(typeof result.testCode).toBe('string');
      expect(result.testCode.length).toBeGreaterThan(0);

      // Should contain required DLest imports
      expect(result.testCode).toContain("const { test, expect } = require('dlest');");

      // Should contain test structure
      expect(result.testCode).toContain('test.describe');
      expect(result.testCode).toContain('async ({ page, dataLayer })');
    });

    test('should generate syntactically correct JavaScript', () => {
      const result = generator.generateTest(sampleParsedRecording, sampleAnalyticsMapping);

      // Basic syntax checks
      expect(result.testCode).toMatch(/const\s+{\s*test,\s*expect\s*}\s*=\s*require\(['"]dlest['"]\);/);
      expect(result.testCode).toMatch(/test\.describe\(/);
      expect(result.testCode).toMatch(/test\(/);
      expect(result.testCode).toMatch(/async\s*\(\s*{\s*page,\s*dataLayer\s*}\s*\)\s*=>/);

      // Should have proper brace matching
      const openBraces = (result.testCode.match(/{/g) || []).length;
      const closeBraces = (result.testCode.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      // Should have proper parentheses matching
      const openParens = (result.testCode.match(/\\(/g) || []).length;
      const closeParens = (result.testCode.match(/\\)/g) || []).length;
      expect(openParens).toBe(closeParens);
    });

    test('should include analytics assertions', () => {
      const result = generator.generateTest(sampleParsedRecording, sampleAnalyticsMapping);

      expect(result.testCode).toContain('expect(dataLayer).toHaveEvent');
      expect(result.testCode).toContain("'page_view'");
      expect(result.testCode).toContain("'click'");
    });

    test('should include Playwright actions', () => {
      const result = generator.generateTest(sampleParsedRecording, sampleAnalyticsMapping);

      expect(result.testCode).toContain("await page.goto('https://example.com');");
      expect(result.testCode).toContain("await page.click('#button');");
    });

    test('should respect options configuration', () => {
      const options = {
        describe: false,
        includeComments: false,
        includeTodos: false
      };

      const result = generator.generateTest(sampleParsedRecording, sampleAnalyticsMapping, options);

      expect(result.testCode).not.toContain('test.describe');
      expect(result.testCode).not.toContain('/**');
      expect(result.testCode).not.toContain('TODO');
    });
  });

  describe('buildConfig', () => {
    test('should use default configuration', () => {
      const config = generator.buildConfig({});

      expect(config.testName).toBe('Generated from Chrome Recording');
      expect(config.describe).toBe(true);
      expect(config.includeComments).toBe(true);
      expect(config.includeTodos).toBe(true);
      expect(config.confidence).toBe('low');
      expect(config.template).toBe('auto');
    });

    test('should override defaults with provided options', () => {
      const options = {
        testName: 'Custom Test Name',
        describe: false,
        includeComments: false,
        minConfidence: 'high',
        template: 'ecommerce'
      };

      const config = generator.buildConfig(options);

      expect(config.testName).toBe('Custom Test Name');
      expect(config.describe).toBe(false);
      expect(config.includeComments).toBe(false);
      expect(config.confidence).toBe('high');
      expect(config.template).toBe('ecommerce');
    });
  });

  describe('generateHeader', () => {
    test('should generate informative header comment', () => {
      const header = generator.generateHeader(sampleParsedRecording, sampleAnalyticsMapping);

      expect(header).toContain('/**');
      expect(header).toContain('Auto-generated DLest test');
      expect(header).toContain('Test Recording');
      expect(header).toContain('basic (medium confidence)');
      expect(header).toContain('TODO');
      expect(header).toContain('*/');
    });

    test('should include metadata in header', () => {
      const recording = {
        ...sampleParsedRecording,
        processedSteps: Array(5).fill().map((_, i) => ({ id: `step_${i}` }))
      };
      const mapping = {
        ...sampleAnalyticsMapping,
        summary: { ...sampleAnalyticsMapping.summary, totalEvents: 8 }
      };

      const header = generator.generateHeader(recording, mapping);

      expect(header).toContain('Steps: 5');
      expect(header).toContain('Suggested events: 8');
    });
  });

  describe('formatExpectedData', () => {
    test('should format simple objects inline', () => {
      const data = {
        currency: 'USD',
        value: 'expect.any(Number)'
      };

      const result = generator.formatExpectedData(data, '  ');
      expect(result).toBe('{ currency: USD, value: expect.any(Number) }');
    });

    test('should format complex objects multiline', () => {
      const data = {
        currency: 'expect.any(String)',
        value: 'expect.any(Number)',
        items: 'expect.arrayContaining([expect.objectContaining({item_id: expect.any(String)})])'
      };

      const result = generator.formatExpectedData(data, '  ');
      
      expect(result).toContain('{\\n');
      expect(result).toContain('\\n  }');
      expect(result).toContain('currency: expect.any(String),');
      expect(result).toContain('value: expect.any(Number),');
    });

    test('should handle empty data', () => {
      const result = generator.formatExpectedData({}, '  ');
      expect(result).toBe('{}');

      const resultNull = generator.formatExpectedData(null, '  ');
      expect(resultNull).toBe('{}');
    });
  });

  describe('generateEventAssertion', () => {
    test('should generate simple event assertion', () => {
      const event = {
        eventName: 'page_view',
        confidence: 'high',
        reason: 'Navigation triggers page view'
      };
      const config = { includeComments: false, includeTodos: false };

      const result = generator.generateEventAssertion(event, '  ', config);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toBe("  expect(dataLayer).toHaveEvent('page_view');");
    });

    test('should generate assertion with expected data', () => {
      const event = {
        eventName: 'add_to_cart',
        confidence: 'high',
        reason: 'Add to cart action',
        expectedData: {
          currency: 'expect.any(String)',
          value: 'expect.any(Number)'
        }
      };
      const config = { includeComments: false, includeTodos: false };

      const result = generator.generateEventAssertion(event, '  ', config);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toContain("expect(dataLayer).toHaveEvent('add_to_cart',");
      expect(result[0]).toContain('currency: expect.any(String)');
      expect(result[0]).toContain('value: expect.any(Number)');
    });

    test('should include confidence comments when verbose', () => {
      const event = {
        eventName: 'click',
        confidence: 'medium',
        reason: 'Button interaction detected'
      };
      const config = { verbose: true, includeComments: true, includeTodos: false };

      const result = generator.generateEventAssertion(event, '  ', config);
      
      expect(result.length).toBeGreaterThan(1);
      expect(result[0]).toContain('// medium confidence: Button interaction detected');
    });

    test('should add TODO for low confidence events', () => {
      const event = {
        eventName: 'custom_event',
        confidence: 'low',
        reason: 'Generic action'
      };
      const config = { includeComments: false, includeTodos: true };

      const result = generator.generateEventAssertion(event, '  ', config);
      
      expect(result.some(line => line.includes('TODO'))).toBe(true);
      expect(result.some(line => line.includes('Verify custom_event'))).toBe(true);
    });
  });

  describe('shouldIncludeEvent', () => {
    test('should include high confidence events', () => {
      const event = { confidence: 'high' };
      const config = { confidence: 'low' };

      const result = generator.shouldIncludeEvent(event, config);
      expect(result).toBe(true);
    });

    test('should include medium confidence events when min is low', () => {
      const event = { confidence: 'medium' };
      const config = { confidence: 'low' };

      const result = generator.shouldIncludeEvent(event, config);
      expect(result).toBe(true);
    });

    test('should exclude low confidence events when min is high', () => {
      const event = { confidence: 'low' };
      const config = { confidence: 'high' };

      const result = generator.shouldIncludeEvent(event, config);
      expect(result).toBe(false);
    });

    test('should handle unknown confidence levels', () => {
      const event = { confidence: 'unknown' };
      const config = { confidence: 'medium' };

      const result = generator.shouldIncludeEvent(event, config);
      expect(result).toBe(false);
    });
  });

  describe('sanitizeTestName', () => {
    test('should remove special characters', () => {
      const result = generator.sanitizeTestName('Test @#$% Name!');
      expect(result).toBe('Test  Name');
    });

    test('should normalize spaces', () => {
      const result = generator.sanitizeTestName('Test   Multiple    Spaces');
      expect(result).toBe('Test Multiple Spaces');
    });

    test('should trim whitespace', () => {
      const result = generator.sanitizeTestName('  Test Name  ');
      expect(result).toBe('Test Name');
    });

    test('should preserve hyphens and underscores', () => {
      const result = generator.sanitizeTestName('Test-Name_With-Special_Chars');
      expect(result).toBe('Test-Name_With-Special_Chars');
    });
  });

  describe('sanitizeFilename', () => {
    test('should create valid filename', () => {
      const result = generator.sanitizeFilename('Test @#$% Name!');
      expect(result).toBe('test-name');
    });

    test('should convert to lowercase', () => {
      const result = generator.sanitizeFilename('TEST NAME');
      expect(result).toBe('test-name');
    });

    test('should replace spaces with hyphens', () => {
      const result = generator.sanitizeFilename('test name with spaces');
      expect(result).toBe('test-name-with-spaces');
    });

    test('should normalize multiple hyphens', () => {
      const result = generator.sanitizeFilename('test---name');
      expect(result).toBe('test-name');
    });
  });

  describe('generateFilename', () => {
    test('should generate filename with title and date', () => {
      const result = generator.generateFilename('My Test Recording', {});
      
      expect(result).toMatch(/^my-test-recording-\\d{4}-\\d{2}-\\d{2}\\.test\\.js$/);
    });

    test('should handle long titles', () => {
      const longTitle = 'This is a very long test recording title that should be properly sanitized';
      const result = generator.generateFilename(longTitle, {});
      
      expect(result).toContain('this-is-a-very-long-test-recording-title');
      expect(result).toMatch(/\\.test\\.js$/);
    });
  });

  describe('generateSuggestions', () => {
    test('should suggest review for low confidence events', () => {
      const mapping = {
        events: [
          {
            events: [
              { eventName: 'click', confidence: 'low' },
              { eventName: 'page_view', confidence: 'high' }
            ]
          }
        ],
        journeyType: { confidence: 'high' }
      };

      const result = generator.generateSuggestions(mapping);
      
      expect(result.some(s => s.type === 'confidence')).toBe(true);
      const confidenceSuggestion = result.find(s => s.type === 'confidence');
      expect(confidenceSuggestion.message).toContain('1 events have low confidence');
      expect(confidenceSuggestion.events).toContain('click');
    });

    test('should suggest manual template selection for low journey confidence', () => {
      const mapping = {
        events: [],
        journeyType: { confidence: 'low', primary: 'unknown' }
      };

      const result = generator.generateSuggestions(mapping);
      
      expect(result.some(s => s.type === 'journey')).toBe(true);
      const journeySuggestion = result.find(s => s.type === 'journey');
      expect(journeySuggestion.message).toContain('Journey type detection has low confidence');
    });

    test('should suggest coverage improvements for incomplete e-commerce flows', () => {
      const mapping = {
        events: [],
        journeyType: { primary: 'ecommerce' },
        summary: {
          eventTypes: ['page_view', 'click']
        }
      };

      const result = generator.generateSuggestions(mapping);
      
      expect(result.some(s => s.type === 'coverage')).toBe(true);
      const coverageSuggestion = result.find(s => s.type === 'coverage');
      expect(coverageSuggestion.message).toContain('E-commerce journey detected but no add_to_cart events');
    });
  });

  describe('generatePreview', () => {
    test('should generate preview without full test code', () => {
      const result = generator.generatePreview(sampleParsedRecording, sampleAnalyticsMapping);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('steps');
      expect(result).toHaveProperty('suggestions');

      // Should not generate full test code
      expect(result).not.toHaveProperty('testCode');

      // Summary should contain key information
      expect(result.summary.title).toBe('Test Recording');
      expect(result.summary.stepsCount).toBe(2);
      expect(result.summary.eventsCount).toBe(2);
      expect(result.summary.journeyType).toBe('basic');
    });

    test('should include step-by-step breakdown', () => {
      const result = generator.generatePreview(sampleParsedRecording, sampleAnalyticsMapping);

      expect(result.steps).toHaveLength(2);
      
      const firstStep = result.steps[0];
      expect(firstStep.step).toBe(1);
      expect(firstStep.type).toBe('navigate');
      expect(firstStep.description).toContain('Navigate to https://example.com');
      expect(firstStep.expectedEvents).toContain('page_view');

      const secondStep = result.steps[1];
      expect(secondStep.step).toBe(2);
      expect(secondStep.type).toBe('click');
      expect(secondStep.expectedEvents).toContain('click');
    });
  });

  describe('e-commerce test generation', () => {
    test('should generate comprehensive e-commerce test', () => {
      const ecommerceRecording = {
        title: 'E-commerce Purchase Flow',
        processedSteps: [
          {
            id: 'step_0',
            type: 'navigate',
            url: 'https://store.com/product/123',
            action: "await page.goto('https://store.com/product/123');"
          },
          {
            id: 'step_1',
            type: 'click',
            selector: '#add-to-cart',
            action: "await page.click('#add-to-cart');"
          },
          {
            id: 'step_2',
            type: 'click',
            selector: '#checkout',
            action: "await page.click('#checkout');"
          }
        ],
        metadata: { domains: ['store.com'] }
      };

      const ecommerceMapping = {
        journeyType: { primary: 'ecommerce', confidence: 'high' },
        events: [
          {
            stepId: 'step_0',
            stepType: 'navigate',
            events: [
              { eventName: 'page_view', confidence: 'high' },
              { eventName: 'view_item', confidence: 'high' }
            ]
          },
          {
            stepId: 'step_1',
            stepType: 'click',
            events: [
              { eventName: 'add_to_cart', confidence: 'high' }
            ]
          },
          {
            stepId: 'step_2',
            stepType: 'click',
            events: [
              { eventName: 'begin_checkout', confidence: 'high' }
            ]
          }
        ],
        summary: {
          totalEvents: 4,
          recommendedTemplate: 'ecommerce',
          eventTypes: ['page_view', 'view_item', 'add_to_cart', 'begin_checkout']
        }
      };

      const result = generator.generateTest(ecommerceRecording, ecommerceMapping);

      expect(result.testCode).toContain('view_item');
      expect(result.testCode).toContain('add_to_cart');
      expect(result.testCode).toContain('begin_checkout');
      expect(result.testCode).toContain('currency');
      expect(result.testCode).toContain('items');
      expect(result.metadata.journeyType).toBe('ecommerce');
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle recording with no analytics events', () => {
      const emptyMapping = {
        journeyType: { primary: 'unknown', confidence: 'low' },
        events: [],
        summary: {
          totalEvents: 0,
          recommendedTemplate: 'basic',
          eventTypes: []
        }
      };

      const result = generator.generateTest(sampleParsedRecording, emptyMapping);

      expect(result.testCode).toBeDefined();
      expect(result.testCode).toContain('test.describe');
      expect(result.testCode).toContain('await page.goto');
      expect(result.testCode).toContain('await page.click');
    });

    test('should handle malformed analytics mapping', () => {
      const malformedMapping = {
        journeyType: { primary: 'basic' },
        events: [
          {
            stepId: 'step_0',
            events: null // Malformed events
          }
        ],
        summary: {
          totalEvents: 0,
          recommendedTemplate: 'basic'
        }
      };

      expect(() => {
        generator.generateTest(sampleParsedRecording, malformedMapping);
      }).not.toThrow();
    });

    test('should handle empty processed steps', () => {
      const emptyRecording = {
        ...sampleParsedRecording,
        processedSteps: []
      };

      const result = generator.generateTest(emptyRecording, sampleAnalyticsMapping);

      expect(result.testCode).toBeDefined();
      expect(result.testCode).toContain('test.describe');
    });

    test('should handle very long step descriptions', () => {
      const longRecording = {
        ...sampleParsedRecording,
        processedSteps: [
          {
            id: 'step_0',
            type: 'click',
            selector: 'div > section > article > div > button.very-long-class-name-that-goes-on-and-on',
            action: "await page.click('div > section > article > div > button.very-long-class-name-that-goes-on-and-on');"
          }
        ]
      };

      const result = generator.generateTest(longRecording, sampleAnalyticsMapping);

      expect(result.testCode).toBeDefined();
      expect(result.testCode.length).toBeGreaterThan(0);
    });
  });

  describe('template selection', () => {
    test('should select ecommerce template for ecommerce journey', () => {
      const template = generator.selectTemplate('ecommerce', { template: 'auto' });
      expect(template).toBeDefined();
      expect(template.name).toBe('E-commerce Template');
    });

    test('should override with explicit template', () => {
      const template = generator.selectTemplate('ecommerce', { template: 'form' });
      expect(template).toBeDefined();
      expect(template.name).toBe('Form Template');
    });

    test('should fallback to basic template for unknown types', () => {
      const template = generator.selectTemplate('unknown', { template: 'auto' });
      expect(template).toBeDefined();
      expect(template.name).toBe('Basic Template');
    });
  });

  describe('metadata generation', () => {
    test('should generate comprehensive metadata', () => {
      const result = generator.generateTest(sampleParsedRecording, sampleAnalyticsMapping);

      expect(result.metadata.originalTitle).toBe('Test Recording');
      expect(result.metadata.stepsCount).toBe(2);
      expect(result.metadata.eventsCount).toBe(2);
      expect(result.metadata.journeyType).toBe('basic');
      expect(result.metadata.confidence).toBe('medium');
      expect(result.metadata.domains).toEqual(['example.com']);
      expect(result.metadata.generatedAt).toBeDefined();
    });
  });
});