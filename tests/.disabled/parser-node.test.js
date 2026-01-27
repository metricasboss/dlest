const assert = require('assert');
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

// Simple test runner
function describe(name, fn) {
  console.log(`\\n📋 ${name}`);
  fn();
}

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
  }
}

// Custom assertions
const expect = (actual) => ({
  toBe: (expected) => assert.strictEqual(actual, expected),
  toEqual: (expected) => assert.deepStrictEqual(actual, expected),
  toContain: (expected) => assert(actual.includes(expected), `Expected ${actual} to contain ${expected}`),
  toMatch: (regex) => assert(regex.test(actual), `Expected ${actual} to match ${regex}`),
  toBeGreaterThan: (expected) => assert(actual > expected, `Expected ${actual} to be greater than ${expected}`),
  toBeLessThan: (expected) => assert(actual < expected, `Expected ${actual} to be less than ${expected}`),
  toHaveLength: (expected) => assert.strictEqual(actual.length, expected),
  toHaveProperty: (prop, value) => {
    assert(actual.hasOwnProperty(prop), `Expected object to have property ${prop}`);
    if (value !== undefined) {
      assert.strictEqual(actual[prop], value);
    }
  },
  toBeDefined: () => assert(actual !== undefined, 'Expected value to be defined'),
  toBeUndefined: () => assert(actual === undefined, 'Expected value to be undefined'),
  toBeTruthy: () => assert(actual, 'Expected value to be truthy'),
  toBeFalsy: () => assert(!actual, 'Expected value to be falsy'),
  toThrow: (expectedMessage) => {
    let threw = false;
    let actualMessage = '';
    try {
      if (typeof actual === 'function') {
        actual();
      }
    } catch (error) {
      threw = true;
      actualMessage = error.message;
    }
    assert(threw, 'Expected function to throw');
    if (expectedMessage) {
      assert(actualMessage.includes(expectedMessage), `Expected error message to contain "${expectedMessage}", got "${actualMessage}"`);
    }
  }
});

// Additional array assertions
expect.arrayContaining = (items) => (actual) => {
  assert(Array.isArray(actual), 'Expected array');
  items.forEach(item => {
    assert(actual.includes(item), `Expected array to contain ${item}`);
  });
};

expect.objectContaining = (props) => (actual) => {
  assert(typeof actual === 'object', 'Expected object');
  Object.keys(props).forEach(key => {
    assert(actual.hasOwnProperty(key), `Expected object to have property ${key}`);
  });
};

expect.any = (constructor) => (actual) => {
  if (constructor === String) return typeof actual === 'string';
  if (constructor === Number) return typeof actual === 'number';
  if (constructor === Array) return Array.isArray(actual);
  return actual instanceof constructor;
};

// Tests
describe('ChromeRecorderParser', () => {
  let parser;

  parser = new ChromeRecorderParser();

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
      assert(Array.isArray(result.processedSteps));
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

    test('should handle empty selectors array', () => {
      const result = parser.extractBestSelector([]);
      expect(result).toBe('SELECTOR_NOT_FOUND');
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
      assert(result.domains.includes('example.com'));
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
      assert(result.metadata.domains.includes('example-store.com'));
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
  });
});

console.log('\\n🎉 Parser tests completed!');