/**
 * DLest Test Generator
 * 
 * Generates valid DLest test code from parsed Chrome Recorder data
 * and analytics mappings
 */

class TestGenerator {
  constructor() {
    this.indentation = '  ';
    this.templates = this.initializeTemplates();
  }

  /**
   * Generate complete DLest test from recording and analytics mapping
   */
  generateTest(parsedRecording, analyticsMapping, options = {}) {
    const config = this.buildConfig(options);
    const template = this.selectTemplate(analyticsMapping.summary.recommendedTemplate, config);
    
    return {
      testCode: this.buildTestCode(parsedRecording, analyticsMapping, template, config),
      metadata: this.generateTestMetadata(parsedRecording, analyticsMapping, config),
      suggestions: this.generateSuggestions(analyticsMapping),
      filename: this.generateFilename(parsedRecording.title, config)
    };
  }

  /**
   * Build configuration from options
   */
  buildConfig(options) {
    return {
      testName: options.testName || 'Generated from Chrome Recording',
      describe: options.describe !== false, // Default to true
      includeComments: options.includeComments !== false, // Default to true
      includeTodos: options.includeTodos !== false, // Default to true
      confidence: options.minConfidence || 'low',
      template: options.template || 'auto',
      baseUrl: options.baseUrl || null,
      verbose: options.verbose || false
    };
  }

  /**
   * Select appropriate template
   */
  selectTemplate(recommendedTemplate, config) {
    if (config.template !== 'auto') {
      return this.templates[config.template] || this.templates.basic;
    }
    
    return this.templates[recommendedTemplate] || this.templates.basic;
  }

  /**
   * Build the complete test code
   */
  buildTestCode(parsedRecording, analyticsMapping, template, config) {
    const parts = [];
    
    // Header comment
    if (config.includeComments) {
      parts.push(this.generateHeader(parsedRecording, analyticsMapping));
    }
    
    // Imports
    parts.push(this.generateImports());
    
    // Test structure
    if (config.describe) {
      parts.push(this.generateDescribeBlock(parsedRecording, analyticsMapping, config));
    } else {
      parts.push(this.generateStandaloneTest(parsedRecording, analyticsMapping, config));
    }
    
    return parts.join('\n\n') + '\n';
  }

  /**
   * Generate file header with metadata
   */
  generateHeader(parsedRecording, analyticsMapping) {
    const header = [
      '/**',
      ` * Auto-generated DLest test from Chrome DevTools Recording`,
      ` * Original title: ${parsedRecording.title}`,
      ` * Generated on: ${new Date().toISOString()}`,
      ` * Journey type: ${analyticsMapping.journeyType.primary} (${analyticsMapping.journeyType.confidence} confidence)`,
      ` * Steps: ${parsedRecording.processedSteps.length}`,
      ` * Suggested events: ${analyticsMapping.summary.totalEvents}`,
      ` * `,
      ` * TODO: Review and adjust the expected data layer events below`,
      ` * TODO: Update selectors if they seem fragile`,
      ` * TODO: Add meaningful assertions based on your actual implementation`,
      ` */`
    ];
    
    return header.join('\n');
  }

  /**
   * Generate imports
   */
  generateImports() {
    return `const { test, expect } = require('dlest');`;
  }

  /**
   * Generate describe block with test
   */
  generateDescribeBlock(parsedRecording, analyticsMapping, config) {
    const describeName = this.sanitizeTestName(parsedRecording.title || 'Recorded Journey');
    const testName = config.testName || 'should track analytics correctly';
    
    const lines = [
      `test.describe('${describeName}', () => {`,
      `${this.indentation}test('${testName}', async ({ page, dataLayer }) => {`
    ];
    
    // Add test body
    lines.push(...this.generateTestBody(parsedRecording, analyticsMapping, config, 2));
    
    // Close blocks
    lines.push(`${this.indentation}});`);
    lines.push('});');
    
    return lines.join('\n');
  }

  /**
   * Generate standalone test
   */
  generateStandaloneTest(parsedRecording, analyticsMapping, config) {
    const testName = config.testName || 'recorded journey should track analytics correctly';
    
    const lines = [
      `test('${testName}', async ({ page, dataLayer }) => {`
    ];
    
    // Add test body
    lines.push(...this.generateTestBody(parsedRecording, analyticsMapping, config, 1));
    
    // Close block
    lines.push('});');
    
    return lines.join('\n');
  }

  /**
   * Generate test body content
   */
  generateTestBody(parsedRecording, analyticsMapping, config, indentLevel) {
    const lines = [];
    const indent = this.indentation.repeat(indentLevel);
    
    // Add setup comment
    if (config.includeComments) {
      lines.push(`${indent}// Generated from ${parsedRecording.processedSteps.length} recorded steps`);
      lines.push('');
    }
    
    // Process each step with its analytics
    parsedRecording.processedSteps.forEach((step, index) => {
      // Add step comment
      if (config.includeComments) {
        lines.push(`${indent}// Step ${index + 1}: ${this.getStepDescription(step)}`);
      }
      
      // Add the action
      lines.push(`${indent}${step.action}`);
      
      // Find corresponding analytics mapping
      const mapping = analyticsMapping.events.find(m => m.stepId === step.id);
      if (mapping && mapping.events.length > 0) {
        // Add slight delay for analytics to fire
        lines.push(`${indent}await page.waitForTimeout(100); // Allow analytics to fire`);
        
        // Add analytics assertions
        mapping.events.forEach(event => {
          if (this.shouldIncludeEvent(event, config)) {
            lines.push(...this.generateEventAssertion(event, indent, config));
          }
        });
      } else if (config.includeTodos && step.type !== 'setViewport') {
        // Add TODO for manual review
        lines.push(`${indent}// TODO: Add analytics assertion for ${step.type} action`);
      }
      
      // Add spacing between steps
      if (index < parsedRecording.processedSteps.length - 1) {
        lines.push('');
      }
    });
    
    return lines;
  }

  /**
   * Get human-readable step description
   */
  getStepDescription(step) {
    switch (step.type) {
      case 'navigate':
        return `Navigate to ${step.url}`;
      case 'click':
        return `Click ${step.selector}`;
      case 'fill':
        return `Fill ${step.selector} with "${step.text}"`;
      case 'setViewport':
        return `Set viewport to ${step.width}x${step.height}`;
      default:
        return `${step.type} action`;
    }
  }

  /**
   * Check if event should be included based on confidence and config
   */
  shouldIncludeEvent(event, config) {
    const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    const minConfidence = confidenceOrder[config.confidence] || 1;
    const eventConfidence = confidenceOrder[event.confidence] || 0;
    
    return eventConfidence >= minConfidence;
  }

  /**
   * Generate analytics event assertion
   */
  generateEventAssertion(event, indent, config) {
    const lines = [];
    
    // Add confidence comment if verbose
    if (config.verbose && config.includeComments) {
      lines.push(`${indent}// ${event.confidence} confidence: ${event.reason}`);
    }
    
    // Generate the assertion
    if (event.expectedData && Object.keys(event.expectedData).length > 0) {
      // With expected data
      const dataStr = this.formatExpectedData(event.expectedData, indent);
      lines.push(`${indent}expect(dataLayer).toHaveEvent('${event.eventName}', ${dataStr});`);
    } else {
      // Simple event check
      lines.push(`${indent}expect(dataLayer).toHaveEvent('${event.eventName}');`);
    }
    
    // Add TODO for low confidence events
    if (event.confidence === 'low' && config.includeTodos) {
      lines.push(`${indent}// TODO: Verify ${event.eventName} event and adjust expected data`);
    }
    
    return lines;
  }

  /**
   * Format expected data object for code generation
   */
  formatExpectedData(expectedData, baseIndent) {
    if (!expectedData || Object.keys(expectedData).length === 0) {
      return '{}';
    }
    
    const entries = Object.entries(expectedData);
    
    // Single line for simple objects
    if (entries.length <= 2 && entries.every(([, value]) => typeof value === 'string' && value.length < 30)) {
      const props = entries.map(([key, value]) => `${key}: ${value}`).join(', ');
      return `{ ${props} }`;
    }
    
    // Multi-line for complex objects
    const lines = ['{'];
    entries.forEach(([key, value], index) => {
      const comma = index < entries.length - 1 ? ',' : '';
      lines.push(`${baseIndent}  ${key}: ${value}${comma}`);
    });
    lines.push(`${baseIndent}}`);
    
    return lines.join('\n');
  }

  /**
   * Generate test metadata
   */
  generateTestMetadata(parsedRecording, analyticsMapping, config) {
    return {
      originalTitle: parsedRecording.title,
      generatedAt: new Date().toISOString(),
      stepsCount: parsedRecording.processedSteps.length,
      eventsCount: analyticsMapping.summary.totalEvents,
      journeyType: analyticsMapping.journeyType.primary,
      confidence: analyticsMapping.journeyType.confidence,
      template: config.template,
      domains: parsedRecording.metadata.domains
    };
  }

  /**
   * Generate suggestions for improving the test
   */
  generateSuggestions(analyticsMapping) {
    const suggestions = [];
    
    // Confidence-based suggestions
    const lowConfidenceEvents = analyticsMapping.events
      .flatMap(mapping => mapping.events)
      .filter(event => event.confidence === 'low');
    
    if (lowConfidenceEvents.length > 0) {
      suggestions.push({
        type: 'confidence',
        message: `${lowConfidenceEvents.length} events have low confidence - review and adjust`,
        events: lowConfidenceEvents.map(e => e.eventName)
      });
    }
    
    // Journey type suggestions
    if (analyticsMapping.journeyType.confidence === 'low') {
      suggestions.push({
        type: 'journey',
        message: 'Journey type detection has low confidence - consider specifying template manually',
        detected: analyticsMapping.journeyType.primary
      });
    }
    
    // Event coverage suggestions
    const eventTypes = analyticsMapping.summary.eventTypes;
    if (eventTypes.includes('page_view') && !eventTypes.includes('add_to_cart') && 
        analyticsMapping.journeyType.primary === 'ecommerce') {
      suggestions.push({
        type: 'coverage',
        message: 'E-commerce journey detected but no add_to_cart events found - verify recording completeness'
      });
    }
    
    return suggestions;
  }

  /**
   * Generate appropriate filename
   */
  generateFilename(title, config) {
    const sanitized = this.sanitizeFilename(title);
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    
    return `${sanitized}-${timestamp}.test.js`;
  }

  /**
   * Sanitize string for test names
   */
  sanitizeTestName(name) {
    return name
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special chars
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Sanitize string for filenames
   */
  sanitizeFilename(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s\-_]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Normalize hyphens
      .trim();
  }

  /**
   * Initialize templates configuration
   */
  initializeTemplates() {
    return {
      basic: {
        name: 'Basic Template',
        description: 'Simple test structure for general use cases'
      },
      ecommerce: {
        name: 'E-commerce Template', 
        description: 'Optimized for online shopping flows'
      },
      form: {
        name: 'Form Template',
        description: 'Focused on form interactions and submissions'
      },
      spa: {
        name: 'SPA Template',
        description: 'Single Page Application navigation patterns'
      }
    };
  }

  /**
   * Generate preview of the test without full generation
   */
  generatePreview(parsedRecording, analyticsMapping, options = {}) {
    const config = this.buildConfig(options);
    const summary = {
      title: parsedRecording.title,
      stepsCount: parsedRecording.processedSteps.length,
      eventsCount: analyticsMapping.summary.totalEvents,
      journeyType: analyticsMapping.journeyType.primary,
      confidence: analyticsMapping.journeyType.confidence,
      recommendedTemplate: analyticsMapping.summary.recommendedTemplate,
      filename: this.generateFilename(parsedRecording.title, config)
    };
    
    const stepsPreviw = parsedRecording.processedSteps.map((step, index) => {
      const mapping = analyticsMapping.events.find(m => m.stepId === step.id);
      return {
        step: index + 1,
        type: step.type,
        description: this.getStepDescription(step),
        expectedEvents: mapping ? mapping.events.map(e => e.eventName) : []
      };
    });
    
    return {
      summary,
      steps: stepsPreviw,
      suggestions: this.generateSuggestions(analyticsMapping)
    };
  }
}

module.exports = { TestGenerator };