const { FormatDetector } = require('../../src/recorder/format-detector');
const fs = require('fs');
const path = require('path');

describe('FormatDetector', () => {
  describe('detect', () => {
    test('should detect Chrome Recorder format correctly', () => {
      const chromeRecording = {
        title: 'Test Recording',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com'
          },
          {
            type: 'click',
            selectors: [['#button'], ['.btn']] // Nested array format
          }
        ]
      };

      const result = FormatDetector.detect(chromeRecording);

      expect(result.format).toBe('chrome-recorder');
      expect(result.confidence).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(result.confidence);
    });

    test('should detect Puppeteer Replay format correctly', () => {
      const puppeteerRecording = {
        title: 'Test Recording',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com'
          },
          {
            type: 'click',
            selectors: ['#button', '.btn'] // Simple array format
          },
          {
            type: 'change', // Puppeteer-specific type
            selectors: ['#input'],
            value: 'test'
          }
        ]
      };

      const result = FormatDetector.detect(puppeteerRecording);

      expect(result.format).toBe('puppeteer-replay');
      expect(result.confidence).toBeDefined();
    });

    test('should detect Chrome Recorder with high confidence when selectors are nested', () => {
      const chromeRecording = {
        title: 'Test',
        steps: [
          {
            type: 'click',
            selectors: [['#a'], ['#b'], ['#c']]
          },
          {
            type: 'fill', // Chrome-specific
            selectors: [['#input']],
            value: 'test'
          }
        ]
      };

      const result = FormatDetector.detect(chromeRecording);

      expect(result.format).toBe('chrome-recorder');
      expect(['high', 'medium']).toContain(result.confidence);
    });

    test('should detect Puppeteer with high confidence for specific types', () => {
      const puppeteerRecording = {
        title: 'Test',
        steps: [
          {
            type: 'click',
            selectors: ['#button']
          },
          {
            type: 'doubleClick', // Puppeteer-specific
            selectors: ['#element']
          },
          {
            type: 'change', // Puppeteer-specific
            selectors: ['#input'],
            value: 'test'
          }
        ]
      };

      const result = FormatDetector.detect(puppeteerRecording);

      expect(result.format).toBe('puppeteer-replay');
      expect(result.confidence).toBe('high');
    });

    test('should detect Puppeteer from viewport with device scale factor', () => {
      const puppeteerRecording = {
        title: 'Test',
        steps: [
          {
            type: 'setViewport',
            width: 1280,
            height: 720,
            deviceScaleFactor: 2, // Puppeteer-specific
            isMobile: false
          },
          {
            type: 'navigate',
            url: 'https://example.com'
          }
        ]
      };

      const result = FormatDetector.detect(puppeteerRecording);

      expect(result.format).toBe('puppeteer-replay');
    });

    test('should detect Chrome Recorder from assertedEvents', () => {
      const chromeRecording = {
        title: 'Test',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com',
            assertedEvents: [ // Chrome Recorder-specific
              { type: 'navigation' }
            ]
          }
        ]
      };

      const result = FormatDetector.detect(chromeRecording);

      expect(result.format).toBe('chrome-recorder');
    });

    test('should accept JSON string as input', () => {
      const recordingJson = JSON.stringify({
        title: 'Test',
        steps: [
          {
            type: 'click',
            selectors: ['#button']
          }
        ]
      });

      const result = FormatDetector.detect(recordingJson);

      expect(result.format).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    test('should throw error for invalid JSON', () => {
      expect(() => {
        FormatDetector.detect('invalid json {');
      }).toThrow();
    });

    test('should throw error for missing steps array', () => {
      expect(() => {
        FormatDetector.detect({ title: 'Test' });
      }).toThrow('missing steps array');
    });

    test('should throw error for empty steps array', () => {
      expect(() => {
        FormatDetector.detect({ title: 'Test', steps: [] });
      }).toThrow('steps array is empty');
    });

    test('should default to chrome-recorder on ambiguous input', () => {
      const ambiguousRecording = {
        title: 'Test',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com'
          }
        ]
      };

      const result = FormatDetector.detect(ambiguousRecording);

      // Should default to chrome-recorder for backwards compatibility
      expect(result.format).toBe('chrome-recorder');
      expect(result.confidence).toBe('low');
    });
  });

  describe('analyzeDetailed', () => {
    test('should return detailed analysis', () => {
      const recording = {
        title: 'Test',
        steps: [
          {
            type: 'click',
            selectors: ['#button']
          },
          {
            type: 'change',
            selectors: ['#input'],
            value: 'test'
          }
        ]
      };

      const result = FormatDetector.analyzeDetailed(recording);

      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('indicators');
      expect(result).toHaveProperty('selectorFormat');
      expect(result).toHaveProperty('stepsCount');
      expect(result).toHaveProperty('stepTypes');
      expect(Array.isArray(result.stepTypes)).toBe(true);
    });

    test('should identify step types correctly', () => {
      const recording = {
        title: 'Test',
        steps: [
          { type: 'navigate', url: 'https://example.com' },
          { type: 'click', selectors: ['#button'] },
          { type: 'change', selectors: ['#input'], value: 'test' }
        ]
      };

      const result = FormatDetector.analyzeDetailed(recording);

      expect(result.stepTypes).toContain('navigate');
      expect(result.stepTypes).toContain('click');
      expect(result.stepTypes).toContain('change');
      expect(result.stepsCount).toBe(3);
    });
  });

  describe('with real example files', () => {
    test('should detect Chrome Recorder example file', () => {
      const filePath = path.join(__dirname, '../../examples/recordings/chrome-recorder-example.json');

      if (fs.existsSync(filePath)) {
        const recording = fs.readFileSync(filePath, 'utf8');
        const result = FormatDetector.detect(recording);

        expect(result.format).toBe('chrome-recorder');
      }
    });

    test('should detect Puppeteer Replay example file', () => {
      const filePath = path.join(__dirname, '../../examples/recordings/puppeteer-example.json');

      if (fs.existsSync(filePath)) {
        const recording = fs.readFileSync(filePath, 'utf8');
        const result = FormatDetector.detect(recording);

        expect(result.format).toBe('puppeteer-replay');
      }
    });
  });
});
