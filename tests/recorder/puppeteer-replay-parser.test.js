const { PuppeteerReplayParser } = require('../../src/recorder/puppeteer-replay-parser');
const fs = require('fs');
const path = require('path');

describe('PuppeteerReplayParser', () => {
  let parser;

  beforeEach(() => {
    parser = new PuppeteerReplayParser();
  });

  describe('parseRecording', () => {
    test('should parse valid Puppeteer Replay recording', () => {
      const recording = {
        title: 'Test Recording',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com'
          },
          {
            type: 'click',
            selectors: ['#button', '.btn']
          }
        ]
      };

      const result = parser.parseRecording(recording);

      expect(result).toHaveProperty('title', 'Test Recording');
      expect(result).toHaveProperty('originalSteps');
      expect(result).toHaveProperty('processedSteps');
      expect(result).toHaveProperty('playwrightActions');
      expect(result).toHaveProperty('analyticsPoints');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.sourceFormat).toBe('puppeteer-replay');
      expect(Array.isArray(result.processedSteps)).toBe(true);
      expect(result.processedSteps.length).toBe(2);
    });

    test('should parse JSON string input', () => {
      const recordingJson = JSON.stringify({
        title: 'Test',
        steps: [
          { type: 'navigate', url: 'https://example.com' }
        ]
      });

      const result = parser.parseRecording(recordingJson);

      expect(result.title).toBe('Test');
    });

    test('should throw error for invalid JSON', () => {
      expect(() => {
        parser.parseRecording('invalid json {');
      }).toThrow('Failed to parse Puppeteer Replay JSON');
    });

    test('should throw error for missing steps', () => {
      expect(() => {
        parser.parseRecording({ title: 'Test' });
      }).toThrow('Recording must contain a "steps" array');
    });

    test('should throw error for empty steps', () => {
      expect(() => {
        parser.parseRecording({ title: 'Test', steps: [] });
      }).toThrow('Recording must contain at least one step');
    });

    test('should use default title if missing', () => {
      const recording = {
        steps: [{ type: 'navigate', url: 'https://example.com' }]
      };

      const result = parser.parseRecording(recording);

      expect(result.title).toBe('Untitled Recording');
    });
  });

  describe('normalizeStep', () => {
    test('should normalize navigate step', () => {
      const step = {
        type: 'navigate',
        url: 'https://example.com'
      };

      const normalized = parser.normalizeStep(step, 0);

      expect(normalized.type).toBe('navigate');
      expect(normalized.url).toBe('https://example.com');
      expect(normalized.action).toContain('page.goto');
      expect(normalized.sourceFormat).toBe('puppeteer-replay');
    });

    test('should normalize click step', () => {
      const step = {
        type: 'click',
        selectors: ['#button', '.btn']
      };

      const normalized = parser.normalizeStep(step, 0);

      expect(normalized.type).toBe('click');
      expect(normalized.selector).toBe('#button');
      expect(normalized.action).toContain('page.click');
    });

    test('should normalize doubleClick step', () => {
      const step = {
        type: 'doubleClick',
        selectors: ['#element']
      };

      const normalized = parser.normalizeStep(step, 0);

      expect(normalized.type).toBe('click'); // Mapped to click
      expect(normalized.action).toContain('page.dblclick');
      expect(normalized.comment).toContain('Double-click');
    });

    test('should map change to fill', () => {
      const step = {
        type: 'change',
        selectors: ['#input'],
        value: 'test value'
      };

      const normalized = parser.normalizeStep(step, 0);

      expect(normalized.type).toBe('fill'); // Mapped from change
      expect(normalized.selector).toBe('#input');
      expect(normalized.text).toBe('test value');
      expect(normalized.action).toContain('page.fill');
    });

    test('should normalize scroll step', () => {
      const step = {
        type: 'scroll',
        x: 0,
        y: 500
      };

      const normalized = parser.normalizeStep(step, 0);

      expect(normalized.type).toBe('scroll');
      expect(normalized.action).toContain('window.scrollTo');
      expect(normalized.action).toContain('500');
    });

    test('should normalize hover step', () => {
      const step = {
        type: 'hover',
        selectors: ['#element']
      };

      const normalized = parser.normalizeStep(step, 0);

      expect(normalized.type).toBe('hover');
      expect(normalized.action).toContain('page.hover');
    });

    test('should normalize setViewport and ignore extra fields', () => {
      const step = {
        type: 'setViewport',
        width: 1280,
        height: 720,
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: false
      };

      const normalized = parser.normalizeStep(step, 0);

      expect(normalized.type).toBe('setViewport');
      expect(normalized.width).toBe(1280);
      expect(normalized.height).toBe(720);
      expect(normalized.action).toContain('setViewportSize');
      expect(normalized.comment).toContain('additional properties');
    });

    test('should normalize waitForElement step', () => {
      const step = {
        type: 'waitForElement',
        selectors: ['#element']
      };

      const normalized = parser.normalizeStep(step, 0);

      expect(normalized.type).toBe('waitForElement');
      expect(normalized.action).toContain('waitForSelector');
    });

    test('should handle waitForExpression with TODO', () => {
      const step = {
        type: 'waitForExpression',
        expression: 'window.dataLayer.length > 0'
      };

      const normalized = parser.normalizeStep(step, 0);

      expect(normalized.action).toContain('TODO');
      expect(normalized.action).toContain('waitForExpression');
      expect(normalized.comment).toContain('manual conversion');
    });

    test('should handle close step gracefully', () => {
      const step = {
        type: 'close'
      };

      const normalized = parser.normalizeStep(step, 0);

      expect(normalized.action).toContain('close step skipped');
    });

    test('should handle keyDown step', () => {
      const step = {
        type: 'keyDown',
        key: 'Enter'
      };

      const normalized = parser.normalizeStep(step, 0);

      expect(normalized.key).toBe('Enter');
      expect(normalized.action).toContain('keyboard.press');
    });
  });

  describe('normalizeSelectors', () => {
    test('should convert simple array to nested array', () => {
      const selectors = ['#button', '.btn', 'button'];
      const normalized = parser.normalizeSelectors(selectors);

      expect(normalized).toEqual([
        ['#button'],
        ['.btn'],
        ['button']
      ]);
    });

    test('should keep nested array unchanged', () => {
      const selectors = [['#button'], ['.btn']];
      const normalized = parser.normalizeSelectors(selectors);

      expect(normalized).toEqual([['#button'], ['.btn']]);
    });

    test('should handle empty array', () => {
      const normalized = parser.normalizeSelectors([]);

      expect(normalized).toEqual([]);
    });

    test('should handle non-array input', () => {
      const normalized = parser.normalizeSelectors(null);

      expect(normalized).toEqual([]);
    });
  });

  describe('extractBestSelector', () => {
    test('should prioritize data-testid selector', () => {
      const selectors = ['.btn', '[data-testid="submit"]', '#button'];
      const best = parser.extractBestSelector(selectors);

      expect(best).toBe('[data-testid="submit"]');
    });

    test('should prioritize ID after data-testid', () => {
      const selectors = ['.btn', '#button', 'button'];
      const best = parser.extractBestSelector(selectors);

      expect(best).toBe('#button');
    });

    test('should prioritize aria selectors', () => {
      const selectors = ['.btn', 'aria/Submit', 'button'];
      const best = parser.extractBestSelector(selectors);

      expect(best).toBe('aria/Submit');
    });

    test('should return first selector as fallback', () => {
      const selectors = ['.btn', '.button'];
      const best = parser.extractBestSelector(selectors);

      expect(best).toBe('.btn');
    });

    test('should handle empty selectors', () => {
      const best = parser.extractBestSelector([]);

      expect(best).toBe('SELECTOR_NOT_FOUND');
    });

    test('should work with simple array format', () => {
      const selectors = ['#button', '.btn'];
      const best = parser.extractBestSelector(selectors);

      expect(best).toBe('#button');
    });
  });

  describe('identifyAnalyticsPoints', () => {
    test('should identify page_view for navigate steps', () => {
      const steps = [
        parser.normalizeStep({
          type: 'navigate',
          url: 'https://example.com'
        }, 0)
      ];

      const points = parser.identifyAnalyticsPoints(steps);

      expect(points.length).toBe(1);
      expect(points[0].suggestedEvents).toContain('page_view');
    });

    test('should identify add_to_cart for appropriate clicks', () => {
      const steps = [
        parser.normalizeStep({
          type: 'click',
          selectors: ['[data-testid="add-to-cart"]']
        }, 0)
      ];

      const points = parser.identifyAnalyticsPoints(steps);

      expect(points.length).toBe(1);
      expect(points[0].suggestedEvents).toContain('add_to_cart');
      expect(points[0].confidence).toBe('high');
    });

    test('should identify form_interaction for change/fill steps', () => {
      const steps = [
        parser.normalizeStep({
          type: 'change',
          selectors: ['#email'],
          value: 'test@example.com'
        }, 0)
      ];

      const points = parser.identifyAnalyticsPoints(steps);

      expect(points.length).toBe(1);
      expect(points[0].suggestedEvents).toContain('form_interaction');
    });

    test('should not identify analytics for unsupported steps', () => {
      const steps = [
        parser.normalizeStep({
          type: 'scroll',
          x: 0,
          y: 100
        }, 0)
      ];

      const points = parser.identifyAnalyticsPoints(steps);

      expect(points.length).toBe(0);
    });
  });

  describe('extractMetadata', () => {
    test('should extract metadata correctly', () => {
      const recording = {
        title: 'Test Recording',
        steps: [
          { type: 'navigate', url: 'https://example.com' },
          { type: 'click', selectors: ['#button'] }
        ]
      };

      const metadata = parser.extractMetadata(recording);

      expect(metadata.title).toBe('Test Recording');
      expect(metadata.stepsCount).toBe(2);
      expect(metadata.hasNavigation).toBe(true);
      expect(metadata.domains).toContain('example.com');
      expect(metadata.sourceFormat).toBe('puppeteer-replay');
      expect(metadata.createdAt).toBeDefined();
    });

    test('should handle recordings without navigation', () => {
      const recording = {
        title: 'Test',
        steps: [
          { type: 'click', selectors: ['#button'] }
        ]
      };

      const metadata = parser.extractMetadata(recording);

      expect(metadata.hasNavigation).toBe(false);
      expect(metadata.domains).toEqual([]);
    });
  });

  describe('with example file', () => {
    test('should parse Puppeteer example file successfully', () => {
      const filePath = path.join(__dirname, '../../examples/recordings/puppeteer-example.json');

      if (fs.existsSync(filePath)) {
        const recording = fs.readFileSync(filePath, 'utf8');
        const result = parser.parseRecording(recording);

        expect(result.title).toBe('E-commerce Add to Cart');
        expect(result.processedSteps.length).toBeGreaterThan(0);
        expect(result.metadata.sourceFormat).toBe('puppeteer-replay');

        // Should have identified analytics points
        expect(result.analyticsPoints.length).toBeGreaterThan(0);

        // Should have converted 'change' to 'fill'
        const fillStep = result.processedSteps.find(s => s.type === 'fill');
        expect(fillStep).toBeDefined();
      }
    });
  });

  describe('compatibility with Chrome Recorder output', () => {
    test('should produce similar output structure to Chrome Recorder parser', () => {
      const puppeteerRecording = {
        title: 'Test',
        steps: [
          { type: 'navigate', url: 'https://example.com' },
          { type: 'click', selectors: ['#button'] }
        ]
      };

      const result = parser.parseRecording(puppeteerRecording);

      // Check that output structure matches what analytics-mapper expects
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('processedSteps');
      expect(result).toHaveProperty('playwrightActions');
      expect(result).toHaveProperty('analyticsPoints');
      expect(result).toHaveProperty('metadata');

      // Check that processedSteps have required fields
      result.processedSteps.forEach(step => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('type');
        expect(step).toHaveProperty('action');
        expect(step).toHaveProperty('originalStep');
      });
    });
  });
});
