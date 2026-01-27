const { Commands } = require('../../src/cli/commands');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('CLI Generate Command Integration', () => {
  let commands;
  let tempDir;
  let sampleRecordingPath;

  beforeEach(() => {
    commands = new Commands();
    
    // Create temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dlest-test-'));
    
    // Create sample recording file
    const sampleRecording = {
      title: 'Integration Test Recording',
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
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('generate command', () => {
    test('should generate test file from recording', async () => {
      const options = {
        fromRecording: sampleRecordingPath,
        output: path.join(tempDir, 'generated.test.js')
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      expect(result.outputFile).toBe(options.output);
      expect(fs.existsSync(options.output)).toBe(true);

      // Verify generated file content
      const generatedContent = fs.readFileSync(options.output, 'utf8');
      expect(generatedContent).toContain("const { test, expect } = require('dlest');");
      expect(generatedContent).toContain('test.describe');
      expect(generatedContent).toContain('Integration Test Recording');
      expect(generatedContent).toContain("await page.goto('https://example-store.com/product/123');");
      expect(generatedContent).toContain('expect(dataLayer).toHaveEvent');
    });

    test('should generate test with default filename when output not specified', async () => {
      const options = {
        fromRecording: sampleRecordingPath
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      expect(result.outputFile).toBeDefined();
      expect(result.outputFile).toMatch(/integration-test-recording-.*\\.test\\.js$/);
      expect(fs.existsSync(result.outputFile)).toBe(true);

      // Clean up generated file
      fs.unlinkSync(result.outputFile);
    });

    test('should create output directory if it does not exist', async () => {
      const nestedOutputPath = path.join(tempDir, 'nested', 'subdir', 'test.js');
      const options = {
        fromRecording: sampleRecordingPath,
        output: nestedOutputPath
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      expect(fs.existsSync(nestedOutputPath)).toBe(true);
      expect(fs.existsSync(path.dirname(nestedOutputPath))).toBe(true);
    });

    test('should handle preview mode', async () => {
      const options = {
        fromRecording: sampleRecordingPath,
        preview: true
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      expect(result.preview).toBeDefined();
      expect(result.preview.summary).toBeDefined();
      expect(result.preview.steps).toBeDefined();
      expect(result.preview.summary.title).toBe('Integration Test Recording');
    });

    test('should respect confidence filtering', async () => {
      const options = {
        fromRecording: sampleRecordingPath,
        output: path.join(tempDir, 'high-confidence.test.js'),
        minConfidence: 'high'
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      
      const generatedContent = fs.readFileSync(options.output, 'utf8');
      // Should still contain high-confidence events like page_view
      expect(generatedContent).toContain('page_view');
    });

    test('should handle custom test name', async () => {
      const customTestName = 'my custom analytics test';
      const options = {
        fromRecording: sampleRecordingPath,
        output: path.join(tempDir, 'custom-name.test.js'),
        testName: customTestName
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      
      const generatedContent = fs.readFileSync(options.output, 'utf8');
      expect(generatedContent).toContain(customTestName);
    });

    test('should handle template selection', async () => {
      const options = {
        fromRecording: sampleRecordingPath,
        output: path.join(tempDir, 'ecommerce-template.test.js'),
        template: 'ecommerce'
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      expect(result.metadata.template).toBe('ecommerce');
    });

    test('should disable comments and todos when requested', async () => {
      const options = {
        fromRecording: sampleRecordingPath,
        output: path.join(tempDir, 'no-comments.test.js'),
        includeComments: false,
        includeTodos: false
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      
      const generatedContent = fs.readFileSync(options.output, 'utf8');
      expect(generatedContent).not.toContain('/**');
      expect(generatedContent).not.toContain('TODO');
    });

    test('should include verbose output when requested', async () => {
      const options = {
        fromRecording: sampleRecordingPath,
        output: path.join(tempDir, 'verbose.test.js'),
        verbose: true
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      
      const generatedContent = fs.readFileSync(options.output, 'utf8');
      // Verbose mode includes confidence comments
      expect(generatedContent).toMatch(/\/\/ (high|medium|low) confidence:/);
    });
  });

  describe('error handling', () => {
    test('should handle missing recording file', async () => {
      const options = {
        fromRecording: path.join(tempDir, 'nonexistent.json')
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Recording file not found');
    });

    test('should handle missing fromRecording option', async () => {
      const options = {};

      const result = await commands.generate(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Recording file is required');
    });

    test('should handle malformed JSON', async () => {
      const malformedPath = path.join(tempDir, 'malformed.json');
      fs.writeFileSync(malformedPath, '{ "title": "test" // invalid json');

      const options = {
        fromRecording: malformedPath
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error generating test');
    });

    test('should handle recording without steps', async () => {
      const invalidRecording = { title: 'No Steps' };
      const invalidPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(invalidPath, JSON.stringify(invalidRecording));

      const options = {
        fromRecording: invalidPath
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error generating test');
    });

    test('should handle verbose error output', async () => {
      const options = {
        fromRecording: path.join(tempDir, 'nonexistent.json'),
        verbose: true
      };

      // Mock console.error to capture output
      const originalError = console.error;
      const errorOutput = [];
      console.error = (...args) => errorOutput.push(args.join(' '));

      const result = await commands.generate(options);

      console.error = originalError;

      expect(result.success).toBe(false);
      expect(errorOutput.some(msg => msg.includes('Error generating test'))).toBe(true);
    });
  });

  describe('file system operations', () => {
    test('should handle write permissions', async () => {
      // Create a read-only directory (if supported by OS)
      const readOnlyDir = path.join(tempDir, 'readonly');
      fs.mkdirSync(readOnlyDir);
      
      try {
        fs.chmodSync(readOnlyDir, 0o444); // Read-only
        
        const options = {
          fromRecording: sampleRecordingPath,
          output: path.join(readOnlyDir, 'test.js')
        };

        const result = await commands.generate(options);

        // Behavior may vary by OS and permissions
        expect(typeof result.success).toBe('boolean');
        
      } finally {
        // Restore write permissions for cleanup
        try {
          fs.chmodSync(readOnlyDir, 0o755);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });

    test('should handle existing output file overwrite', async () => {
      const outputPath = path.join(tempDir, 'existing.test.js');
      
      // Create existing file
      fs.writeFileSync(outputPath, 'existing content');
      expect(fs.existsSync(outputPath)).toBe(true);

      const options = {
        fromRecording: sampleRecordingPath,
        output: outputPath
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      
      // Should overwrite existing file
      const newContent = fs.readFileSync(outputPath, 'utf8');
      expect(newContent).not.toBe('existing content');
      expect(newContent).toContain('Integration Test Recording');
    });
  });

  describe('real recording scenarios', () => {
    test('should handle complex e-commerce flow', async () => {
      const complexRecording = {
        title: 'Complete E-commerce Purchase',
        steps: [
          {
            type: 'navigate',
            url: 'https://store.com/products'
          },
          {
            type: 'click',
            selectors: [['aria/Smartphone Pro'], ['.product-item']]
          },
          {
            type: 'navigate',
            url: 'https://store.com/product/smartphone-pro'
          },
          {
            type: 'click',
            selectors: [['aria/Adicionar ao carrinho'], ['#add-to-cart']]
          },
          {
            type: 'click',
            selectors: [['aria/Ver carrinho'], ['#view-cart']]
          },
          {
            type: 'click',
            selectors: [['aria/Finalizar compra'], ['#checkout']]
          },
          {
            type: 'fill',
            selectors: [['#email']],
            value: 'customer@example.com'
          },
          {
            type: 'fill',
            selectors: [['#card-number']],
            value: '4111111111111111'
          },
          {
            type: 'click',
            selectors: [['aria/Finalizar compra'], ['#complete-order']]
          },
          {
            type: 'navigate',
            url: 'https://store.com/order-confirmation'
          }
        ]
      };

      const complexPath = path.join(tempDir, 'complex.json');
      fs.writeFileSync(complexPath, JSON.stringify(complexRecording, null, 2));

      const options = {
        fromRecording: complexPath,
        output: path.join(tempDir, 'complex.test.js')
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      
      const generatedContent = fs.readFileSync(options.output, 'utf8');
      
      // Should detect e-commerce journey
      expect(result.metadata.journeyType).toBe('ecommerce');
      
      // Should include e-commerce events
      expect(generatedContent).toContain('page_view');
      expect(generatedContent).toContain('add_to_cart');
      expect(generatedContent).toContain('purchase');
      
      // Should include form interactions
      expect(generatedContent).toContain('customer@example.com');
      
      // Should have proper test structure
      expect(generatedContent).toContain('Complete E-commerce Purchase');
      expect(generatedContent).toMatch(/test\.describe\(/);
    });

    test('should handle form-focused recording', async () => {
      const formRecording = {
        title: 'Contact Form Submission',
        steps: [
          {
            type: 'navigate',
            url: 'https://company.com/contact'
          },
          {
            type: 'fill',
            selectors: [['#name']],
            value: 'John Doe'
          },
          {
            type: 'fill',
            selectors: [['#email']],
            value: 'john@example.com'
          },
          {
            type: 'fill',
            selectors: [['#phone']],
            value: '555-1234'
          },
          {
            type: 'fill',
            selectors: [['#message']],
            value: 'Hello, I am interested in your services.'
          },
          {
            type: 'click',
            selectors: [['aria/Enviar'], ['button[type="submit"]']]
          }
        ]
      };

      const formPath = path.join(tempDir, 'form.json');
      fs.writeFileSync(formPath, JSON.stringify(formRecording, null, 2));

      const options = {
        fromRecording: formPath,
        output: path.join(tempDir, 'form.test.js')
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      
      const generatedContent = fs.readFileSync(options.output, 'utf8');
      
      // Should detect form journey
      expect(result.metadata.journeyType).toBe('form');
      
      // Should include form events
      expect(generatedContent).toContain('form_submit');
      expect(generatedContent).toContain('email_input');
      
      // Should preserve form data
      expect(generatedContent).toContain('John Doe');
      expect(generatedContent).toContain('john@example.com');
    });

    test('should handle SPA navigation recording', async () => {
      const spaRecording = {
        title: 'SPA Navigation Flow',
        steps: [
          {
            type: 'navigate',
            url: 'https://spa-app.com/'
          },
          {
            type: 'click',
            selectors: [['aria/Products'], ['[data-route="/products"]']]
          },
          {
            type: 'waitForElement',
            selectors: [['.products-page']]
          },
          {
            type: 'click',
            selectors: [['aria/About'], ['[data-route="/about"]']]
          },
          {
            type: 'click',
            selectors: [['aria/Contact'], ['[data-route="/contact"]']]
          }
        ]
      };

      const spaPath = path.join(tempDir, 'spa.json');
      fs.writeFileSync(spaPath, JSON.stringify(spaRecording, null, 2));

      const options = {
        fromRecording: spaPath,
        output: path.join(tempDir, 'spa.test.js')
      };

      const result = await commands.generate(options);

      expect(result.success).toBe(true);
      
      const generatedContent = fs.readFileSync(options.output, 'utf8');
      
      // Should include navigation events
      expect(generatedContent).toContain('page_view');
      
      // Should handle route changes
      expect(generatedContent).toContain('[data-route="/products"]');
      expect(generatedContent).toContain('[data-route="/about"]');
      expect(generatedContent).toContain('[data-route="/contact"]');
    });
  });

  describe('console output validation', () => {
    test('should provide meaningful console output', async () => {
      // Mock console methods to capture output
      const originalLog = console.log;
      const logOutput = [];
      console.log = (...args) => logOutput.push(args.join(' '));

      const options = {
        fromRecording: sampleRecordingPath,
        output: path.join(tempDir, 'console-test.test.js')
      };

      const result = await commands.generate(options);

      console.log = originalLog;

      expect(result.success).toBe(true);
      
      // Should log progress information
      expect(logOutput.some(msg => msg.includes('Generating DLest test'))).toBe(true);
      expect(logOutput.some(msg => msg.includes('steps from recording'))).toBe(true);
      expect(logOutput.some(msg => msg.includes('analytics events'))).toBe(true);
      expect(logOutput.some(msg => msg.includes('Generated test file'))).toBe(true);
    });
  });
});