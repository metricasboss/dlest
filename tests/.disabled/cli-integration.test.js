const assert = require('assert');
const { Commands } = require('../../../src/cli/commands');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Simple test runner
function describe(name, fn) {
  console.log(`\\n📋 ${name}`);
  fn();
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
  }
}

// Custom assertions
const expect = (actual) => ({
  toBe: (expected) => assert.strictEqual(actual, expected),
  toBeDefined: () => assert(actual !== undefined, 'Expected value to be defined'),
  toContain: (expected) => assert(actual.includes(expected), `Expected ${actual} to contain ${expected}`),
});

describe('CLI Generate Integration', () => {
  let tempDir;
  let sampleRecordingPath;

  // Setup
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dlest-cli-test-'));
  
  const sampleRecording = {
    title: 'CLI Integration Test Recording',
    steps: [
      {
        type: 'navigate',
        url: 'https://example-store.com/product/123'
      },
      {
        type: 'click',
        selectors: [
          ['aria/Adicionar ao carrinho'],
          ['#add-to-cart-btn']
        ]
      },
      {
        type: 'click',
        selectors: [
          ['aria/Finalizar compra'],
          ['#checkout-btn']
        ]
      }
    ]
  };
  
  sampleRecordingPath = path.join(tempDir, 'test-recording.json');
  fs.writeFileSync(sampleRecordingPath, JSON.stringify(sampleRecording, null, 2));

  describe('generate command', () => {
    test('should generate test file from recording', async () => {
      const commands = new Commands();
      const options = {
        fromRecording: sampleRecordingPath,
        output: path.join(tempDir, 'generated.test.js')
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe(options.output);
      assert(fs.existsSync(options.output), 'Generated file should exist');

      // Verify generated file content
      const generatedContent = fs.readFileSync(options.output, 'utf8');
      expect(generatedContent).toContain("const { test, expect } = require('dlest');");
      expect(generatedContent).toContain('test.describe');
      expect(generatedContent).toContain('CLI Integration Test Recording');
      expect(generatedContent).toContain("await page.goto('https://example-store.com/product/123');");
      expect(generatedContent).toContain('expect(dataLayer).toHaveEvent');
    });

    test('should handle preview mode', async () => {
      const commands = new Commands();
      const options = {
        fromRecording: sampleRecordingPath,
        preview: true
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      expect(result.preview).toBeDefined();
      expect(result.preview.summary).toBeDefined();
      expect(result.preview.steps).toBeDefined();
      expect(result.preview.summary.title).toBe('CLI Integration Test Recording');
    });

    test('should handle missing recording file', async () => {
      const commands = new Commands();
      const options = {
        fromRecording: path.join(tempDir, 'nonexistent.json')
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(false);
      assert(result.error.includes('Recording file not found'), 'Should report file not found error');
    });

    test('should handle missing fromRecording option', async () => {
      const commands = new Commands();
      const options = {};

      const result = await commands.generate(options);

      expect(result.success).toBe(false);
      assert(result.error.includes('Recording file is required'), 'Should report missing file error');
    });
  });

  // Cleanup
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

console.log('\\n🎉 CLI Integration tests completed!');