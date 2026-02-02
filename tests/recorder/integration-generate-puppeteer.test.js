const { Commands } = require('../../src/cli/commands');
const fs = require('fs');
const path = require('path');

describe('Integration: Generate from Puppeteer Replay', () => {
  let commands;
  const outputDir = path.join(__dirname, '../../temp-test-output');

  beforeEach(() => {
    commands = new Commands();

    // Create temp output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup temp files
    if (fs.existsSync(outputDir)) {
      fs.readdirSync(outputDir).forEach(file => {
        fs.unlinkSync(path.join(outputDir, file));
      });
      fs.rmdirSync(outputDir);
    }
  });

  test('should generate test from Puppeteer Replay recording', async () => {
    const recordingFile = path.join(__dirname, '../../examples/recordings/puppeteer-example.json');
    const outputFile = path.join(outputDir, 'generated-test.test.js');

    const result = await commands.generate({
      fromRecording: recordingFile,
      output: outputFile,
      template: 'ecommerce'
    });

    expect(result.success).toBe(true);
    expect(result.outputFile).toBe(outputFile);

    // Check that file was created
    expect(fs.existsSync(outputFile)).toBe(true);

    // Read and validate generated test
    const generatedCode = fs.readFileSync(outputFile, 'utf8');

    // Should contain DLest imports
    expect(generatedCode).toContain('const { test, expect }');
    expect(generatedCode).toContain('require(\'dlest\')');

    // Should contain test function
    expect(generatedCode).toContain('test(');
    expect(generatedCode).toContain('async ({ page, dataLayer })');

    // Should contain Playwright actions
    expect(generatedCode).toContain('page.goto');
    expect(generatedCode).toContain('page.click');
    expect(generatedCode).toContain('page.fill'); // change should be converted to fill

    // Should contain analytics expectations
    expect(generatedCode).toContain('expect(dataLayer)');
    expect(generatedCode).toContain('toHaveEvent');

    // Should detect add_to_cart event
    expect(generatedCode).toContain('add_to_cart');
  });

  test('should generate test in preview mode', async () => {
    const recordingFile = path.join(__dirname, '../../examples/recordings/puppeteer-example.json');

    const result = await commands.generate({
      fromRecording: recordingFile,
      preview: true
    });

    expect(result.success).toBe(true);
    expect(result.preview).toBeDefined();
    expect(result.preview.summary).toBeDefined();
    expect(result.preview.steps).toBeDefined();
    expect(Array.isArray(result.preview.steps)).toBe(true);
  });

  test('should generate test from Chrome Recorder recording (regression)', async () => {
    const recordingFile = path.join(__dirname, '../../examples/recordings/chrome-recorder-example.json');
    const outputFile = path.join(outputDir, 'chrome-generated.test.js');

    const result = await commands.generate({
      fromRecording: recordingFile,
      output: outputFile
    });

    expect(result.success).toBe(true);
    expect(fs.existsSync(outputFile)).toBe(true);

    const generatedCode = fs.readFileSync(outputFile, 'utf8');
    expect(generatedCode).toContain('page.goto');
    expect(generatedCode).toContain('page.click');
  });

  test('should produce similar output for equivalent recordings', async () => {
    const puppeteerFile = path.join(__dirname, '../../examples/recordings/puppeteer-example.json');
    const chromeFile = path.join(__dirname, '../../examples/recordings/chrome-recorder-example.json');
    const puppeteerOutput = path.join(outputDir, 'puppeteer-output.test.js');
    const chromeOutput = path.join(outputDir, 'chrome-output.test.js');

    // Generate from Puppeteer
    const puppeteerResult = await commands.generate({
      fromRecording: puppeteerFile,
      output: puppeteerOutput
    });

    // Generate from Chrome
    const chromeResult = await commands.generate({
      fromRecording: chromeFile,
      output: chromeOutput
    });

    expect(puppeteerResult.success).toBe(true);
    expect(chromeResult.success).toBe(true);

    // Read both generated tests
    const puppeteerCode = fs.readFileSync(puppeteerOutput, 'utf8');
    const chromeCode = fs.readFileSync(chromeOutput, 'utf8');

    // Both should have similar structure
    expect(puppeteerCode).toContain('test(');
    expect(chromeCode).toContain('test(');

    // Both should detect the same analytics events
    expect(puppeteerCode).toContain('add_to_cart');
    expect(chromeCode).toContain('add_to_cart');

    // Both should use page.fill (Puppeteer's change should be converted)
    expect(puppeteerCode).toContain('page.fill');
    expect(chromeCode).toContain('page.fill');
  });

  test('should handle invalid recording file', async () => {
    const result = await commands.generate({
      fromRecording: 'non-existent-file.json',
      output: path.join(outputDir, 'output.test.js')
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should handle malformed JSON', async () => {
    const malformedFile = path.join(outputDir, 'malformed.json');
    fs.writeFileSync(malformedFile, '{ invalid json', 'utf8');

    const result = await commands.generate({
      fromRecording: malformedFile,
      output: path.join(outputDir, 'output.test.js')
    });

    expect(result.success).toBe(false);
  });
});
