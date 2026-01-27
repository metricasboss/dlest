const { ChromeRecorderParser } = require('../../../src/recorder/parser');
const fs = require('fs');
const path = require('path');

// Helper function to load fixture files
function loadFixture(filename) {
  const fixturePath = path.join(__dirname, 'fixtures', filename);
  return fs.readFileSync(fixturePath, 'utf8');
}

// Helper function to load JSON fixture
function loadJSONFixture(filename) {
  return JSON.parse(loadFixture(filename));
}

describe('ChromeRecorderParser', () => {
  let parser;

  beforeEach(() => {
    parser = new ChromeRecorderParser();
  });

  describe('parseRecording', () => {
    test('should parse valid recording JSON string', () => {
      const recordingJson = loadFixture('sample-recordings/form-simple.json');
      const result = parser.parseRecording(recordingJson);

      expect(result).toHaveProperty('title', 'Contact Form Submission');
      expect(result).toHaveProperty('originalSteps');
      expect(result).toHaveProperty('processedSteps');
      expect(result).toHaveProperty('playwrightActions');
      expect(result).toHaveProperty('analyticsPoints');
      expect(result).toHaveProperty('metadata');
      expect(Array.isArray(result.processedSteps)).toBe(true);
      expect(result.processedSteps.length).toBeGreaterThan(0);
    });

    test('should parse valid recording object', () => {
      const recordingObject = loadJSONFixture('sample-recordings/ecommerce-complete.json');
      const result = parser.parseRecording(recordingObject);

      expect(result.title).toBe('E-commerce Complete Flow');
      expect(result.processedSteps.length).toBeGreaterThan(0);
    });

    test('should throw error for malformed JSON', () => {
      const malformedJson = loadFixture('invalid-inputs/malformed.json');

      expect(() => {
        parser.parseRecording(malformedJson);
      }).toThrow('Failed to parse Chrome Recorder JSON');
    });

    test('should throw error for empty recording', () => {
      const emptyRecording = loadJSONFixture('invalid-inputs/empty-recording.json');

      expect(() => {
        parser.parseRecording(emptyRecording);
      }).toThrow('Recording must contain at least one step');
    });

    test('should throw error for recording without steps', () => {
      const recordingWithoutSteps = loadJSONFixture('invalid-inputs/missing-steps.json');

      expect(() => {
        parser.parseRecording(recordingWithoutSteps);
      }).toThrow('Recording must contain a "steps" array');
    });

    test('should handle recording with title', () => {
      const recording = {
        title: 'My Custom Recording',
        steps: [
          { type: 'navigate', url: 'https://example.com' }
        ]
      };

      const result = parser.parseRecording(recording);
      expect(result.title).toBe('My Custom Recording');
    });

    test('should use default title when missing', () => {
      const recording = {
        steps: [
          { type: 'navigate', url: 'https://example.com' }
        ]
      };

      const result = parser.parseRecording(recording);
      expect(result.title).toBe('Untitled Recording');
    });
  });

  describe('validateRecording', () => {
    test('should validate correct recording structure', () => {
      const validRecording = {
        title: 'Test',
        steps: [{ type: 'navigate', url: 'https://example.com' }]
      };

      expect(() => {
        parser.validateRecording(validRecording);
      }).not.toThrow();
    });

    test('should reject null or undefined recording', () => {
      expect(() => {
        parser.validateRecording(null);
      }).toThrow('Recording must be a valid object');

      expect(() => {
        parser.validateRecording(undefined);
      }).toThrow('Recording must be a valid object');
    });

    test('should reject recording without steps array', () => {
      const invalidRecording = { title: 'Test' };

      expect(() => {
        parser.validateRecording(invalidRecording);
      }).toThrow('Recording must contain a "steps" array');
    });

    test('should reject recording with non-array steps', () => {
      const invalidRecording = { 
        title: 'Test',
        steps: 'not an array' 
      };

      expect(() => {
        parser.validateRecording(invalidRecording);
      }).toThrow('Recording must contain a "steps" array');
    });
  });

  describe('processSteps', () => {
    test('should filter out invalid steps', () => {
      const steps = [
        { type: 'navigate', url: 'https://example.com' },
        { type: 'invalid_type', data: 'should be filtered' },
        { type: 'click', selectors: [['#button']] },
        null, // Invalid step
        { } // Missing type
      ];

      const result = parser.processSteps(steps);
      expect(result.length).toBe(2);
      expect(result[0].type).toBe('navigate');
      expect(result[1].type).toBe('click');
    });

    test('should normalize step format', () => {
      const steps = [
        { type: 'navigate', url: 'https://example.com' }
      ];

      const result = parser.processSteps(steps);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('type', 'navigate');
      expect(result[0]).toHaveProperty('action');
      expect(result[0]).toHaveProperty('originalStep');
      expect(result[0].id).toMatch(/^step_\\d+$/);
    });
  });

  describe('normalizeStep', () => {
    test('should normalize navigate step', () => {
      const step = { type: 'navigate', url: 'https://example.com/page' };
      const result = parser.normalizeStep(step, 0);

      expect(result.type).toBe('navigate');
      expect(result.url).toBe('https://example.com/page');
      expect(result.action).toBe("await page.goto('https://example.com/page');");
    });

    test('should normalize click step', () => {
      const step = { 
        type: 'click', 
        selectors: [['#button'], ['.btn']] 
      };
      const result = parser.normalizeStep(step, 0);

      expect(result.type).toBe('click');
      expect(result.selector).toBe('#button');
      expect(result.action).toBe("await page.click('#button');");
    });

    test('should normalize fill step', () => {
      const step = { 
        type: 'fill', 
        selectors: [['#input']], 
        value: 'test value' 
      };
      const result = parser.normalizeStep(step, 0);

      expect(result.type).toBe('fill');
      expect(result.selector).toBe('#input');
      expect(result.text).toBe('test value');
      expect(result.action).toBe("await page.fill('#input', 'test value');");
    });

    test('should normalize setViewport step', () => {
      const step = { 
        type: 'setViewport', 
        width: 1280, 
        height: 720 
      };
      const result = parser.normalizeStep(step, 0);

      expect(result.type).toBe('setViewport');
      expect(result.width).toBe(1280);
      expect(result.height).toBe(720);
      expect(result.action).toBe('await page.setViewportSize({ width: 1280, height: 720 });');
    });

    test('should normalize scroll step', () => {
      const step = { 
        type: 'scroll', 
        x: 0, 
        y: 500 
      };
      const result = parser.normalizeStep(step, 0);

      expect(result.type).toBe('scroll');
      expect(result.action).toBe('await page.evaluate(() => window.scrollTo(0, 500));');
    });

    test('should normalize hover step', () => {
      const step = { 
        type: 'hover', 
        selectors: [['#element']] 
      };
      const result = parser.normalizeStep(step, 0);

      expect(result.type).toBe('hover');
      expect(result.selector).toBe('#element');
      expect(result.action).toBe("await page.hover('#element');");
    });

    test('should handle unsupported step types', () => {
      const step = { 
        type: 'unsupported_type',
        data: 'some data'
      };
      const result = parser.normalizeStep(step, 0);

      expect(result.type).toBe('unsupported_type');
      expect(result.action).toBe('// TODO: Handle unsupported_type step');
    });
  });

  describe('extractBestSelector', () => {
    test('should prioritize data-testid selectors', () => {
      const selectors = [
        ['div > span'],
        ['[data-testid="my-element"]'],
        ['#my-id']
      ];

      const result = parser.extractBestSelector(selectors);
      expect(result).toBe('[data-testid="my-element"]');
    });

    test('should prioritize ID selectors when no data-testid', () => {
      const selectors = [
        ['div > span'],
        ['#my-id'],
        ['.my-class']
      ];

      const result = parser.extractBestSelector(selectors);
      expect(result).toBe('#my-id');
    });

    test('should prioritize aria selectors', () => {
      const selectors = [
        ['div > span'],
        ['aria/Button text'],
        ['.my-class']
      ];

      const result = parser.extractBestSelector(selectors);
      expect(result).toBe('aria/Button text');
    });

    test('should return first selector as fallback', () => {
      const selectors = [
        ['div > span.complex'],
        ['.another-class']
      ];

      const result = parser.extractBestSelector(selectors);
      expect(result).toBe('div > span.complex');
    });

    test('should handle empty selectors array', () => {
      const result = parser.extractBestSelector([]);
      expect(result).toBe('SELECTOR_NOT_FOUND');
    });

    test('should handle nested selector arrays', () => {
      const selectors = [
        [['div > span'], 'alternative'],
        ['#my-id']
      ];

      const result = parser.extractBestSelector(selectors);
      expect(result).toBe('#my-id');
    });

    test('should handle non-string selectors', () => {
      const selectors = [
        [null],
        [undefined],
        ['#valid-selector']
      ];

      const result = parser.extractBestSelector(selectors);
      expect(result).toBe('#valid-selector');
    });
  });

  describe('identifyAnalyticsPoints', () => {
    test('should identify analytics points in processed steps', () => {
      const steps = [
        {
          id: 'step_0',
          type: 'navigate',
          url: 'https://example.com'
        },
        {
          id: 'step_1',
          type: 'click',
          selector: '#add-to-cart'
        }
      ];

      const result = parser.identifyAnalyticsPoints(steps);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should suggest page_view for navigation', () => {
      const steps = [
        {
          id: 'step_0',
          type: 'navigate',
          url: 'https://example.com'
        }
      ];

      const result = parser.identifyAnalyticsPoints(steps);
      const navPoint = result.find(p => p.type === 'navigate');
      
      expect(navPoint).toBeDefined();
      expect(navPoint.suggestedEvents).toContain('page_view');
      expect(navPoint.comment).toBe('Page view tracking');
    });

    test('should suggest appropriate events for click actions', () => {
      const steps = [
        {
          id: 'step_0',
          type: 'click',
          selector: '#add-to-cart-button'
        }
      ];

      const result = parser.identifyAnalyticsPoints(steps);
      const clickPoint = result.find(p => p.type === 'click');
      
      expect(clickPoint).toBeDefined();
      expect(clickPoint.suggestedEvents).toContain('add_to_cart');
    });

    test('should handle steps without analytics potential', () => {
      const steps = [
        {
          id: 'step_0',
          type: 'setViewport',
          width: 1280,
          height: 720
        }
      ];

      const result = parser.identifyAnalyticsPoints(steps);
      expect(result.length).toBe(0);
    });
  });

  describe('extractMetadata', () => {
    test('should extract basic metadata', () => {
      const recording = {
        title: 'Test Recording',
        steps: [
          { type: 'navigate', url: 'https://example.com' },
          { type: 'click', selectors: [['#button']] }
        ]
      };

      const result = parser.extractMetadata(recording);
      
      expect(result.title).toBe('Test Recording');
      expect(result.stepsCount).toBe(2);
      expect(result.hasNavigation).toBe(true);
      expect(result.domains).toContain('example.com');
      expect(result.createdAt).toBeDefined();
    });

    test('should handle recording without navigation', () => {
      const recording = {
        title: 'No Navigation',
        steps: [
          { type: 'click', selectors: [['#button']] }
        ]
      };

      const result = parser.extractMetadata(recording);
      expect(result.hasNavigation).toBe(false);
      expect(result.domains).toHaveLength(0);
    });

    test('should extract multiple domains', () => {
      const recording = {
        title: 'Multi-domain',
        steps: [
          { type: 'navigate', url: 'https://example.com' },
          { type: 'navigate', url: 'https://another.com/page' },
          { type: 'navigate', url: 'https://example.com/other' }
        ]
      };

      const result = parser.extractMetadata(recording);
      expect(result.domains).toContain('example.com');
      expect(result.domains).toContain('another.com');
      expect(result.domains).toHaveLength(2); // Should deduplicate
    });

    test('should handle invalid URLs gracefully', () => {
      const recording = {
        title: 'Invalid URLs',
        steps: [
          { type: 'navigate', url: 'not-a-valid-url' },
          { type: 'navigate', url: 'https://valid.com' }
        ]
      };

      const result = parser.extractMetadata(recording);
      expect(result.domains).toContain('valid.com');
      expect(result.domains).toHaveLength(1);
    });
  });

  describe('real recording integration', () => {
    test('should parse complete e-commerce recording', () => {
      const recording = loadJSONFixture('sample-recordings/ecommerce-complete.json');
      const result = parser.parseRecording(recording);

      expect(result.title).toBe('E-commerce Complete Flow');
      expect(result.processedSteps.length).toBeGreaterThan(5);
      
      // Should have navigation steps
      const navSteps = result.processedSteps.filter(s => s.type === 'navigate');
      expect(navSteps.length).toBeGreaterThan(1);
      
      // Should have click steps for e-commerce actions
      const clickSteps = result.processedSteps.filter(s => s.type === 'click');
      expect(clickSteps.length).toBeGreaterThan(2);
      
      // Should identify analytics points
      expect(result.analyticsPoints.length).toBeGreaterThan(0);
      
      // Should extract domains
      expect(result.metadata.domains).toContain('example-store.com');
    });

    test('should parse form recording', () => {
      const recording = loadJSONFixture('sample-recordings/form-simple.json');
      const result = parser.parseRecording(recording);

      expect(result.title).toBe('Contact Form Submission');
      
      // Should have fill steps
      const fillSteps = result.processedSteps.filter(s => s.type === 'fill');
      expect(fillSteps.length).toBeGreaterThan(2);
      
      // Should have submit action
      const clickSteps = result.processedSteps.filter(s => s.type === 'click');
      expect(clickSteps.length).toBeGreaterThan(0);
    });

    test('should parse SPA navigation recording', () => {
      const recording = loadJSONFixture('sample-recordings/spa-navigation.json');
      const result = parser.parseRecording(recording);

      expect(result.title).toBe('SPA Navigation Flow');
      
      // Should have navigation and click steps
      const navSteps = result.processedSteps.filter(s => s.type === 'navigate');
      const clickSteps = result.processedSteps.filter(s => s.type === 'click');
      
      expect(navSteps.length).toBeGreaterThan(0);
      expect(clickSteps.length).toBeGreaterThan(0);
    });
  });

  describe('confidence calculation', () => {
    test('should calculate high confidence for clear e-commerce patterns', () => {
      const step = {
        type: 'click',
        selector: '#add-to-cart-button'
      };

      const confidence = parser.calculateConfidence(step);
      expect(confidence).toBe('high');
    });

    test('should calculate medium confidence for common patterns', () => {
      const step = {
        type: 'click',
        selector: 'button.submit-form'
      };

      const confidence = parser.calculateConfidence(step);
      expect(confidence).toBe('medium');
    });

    test('should calculate low confidence for generic actions', () => {
      const step = {
        type: 'click',
        selector: 'div > span'
      };

      const confidence = parser.calculateConfidence(step);
      expect(confidence).toBe('low');
    });
  });

  describe('error handling', () => {
    test('should provide helpful error messages', () => {
      expect(() => {
        parser.parseRecording('invalid json {');
      }).toThrow(/Failed to parse Chrome Recorder JSON/);

      expect(() => {
        parser.parseRecording({ title: 'test' });
      }).toThrow(/Recording must contain a "steps" array/);
    });

    test('should handle edge cases gracefully', () => {
      // Empty steps array
      expect(() => {
        parser.parseRecording({ steps: [] });
      }).toThrow(/Recording must contain at least one step/);

      // Steps with missing data
      const recording = {
        steps: [
          { type: 'click' }, // Missing selectors
          { type: 'fill' }, // Missing selectors and value
          { type: 'navigate' } // Missing URL
        ]
      };

      const result = parser.parseRecording(recording);
      expect(result.processedSteps.length).toBe(3);
      
      // Should handle missing data gracefully
      expect(result.processedSteps[0].selector).toBe('SELECTOR_NOT_FOUND');
      expect(result.processedSteps[1].text).toBe('');
    });
  });
});