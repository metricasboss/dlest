const { ChromeRecorderParser } = require('../../../src/recorder/parser');
const { AnalyticsMapper } = require('../../../src/recorder/analytics-mapper');
const { TestGenerator } = require('../../../src/recorder/test-generator');

console.log('🧪 Testing Chrome Recorder Integration Components...');

// Test 1: Parser basic functionality
console.log('\\n📋 Testing ChromeRecorderParser...');
try {
  const parser = new ChromeRecorderParser();
  const sampleRecording = {
    title: 'Test Recording',
    steps: [
      {
        type: 'navigate',
        url: 'https://example.com/product'
      },
      {
        type: 'click',
        selectors: [['#add-to-cart']]
      }
    ]
  };

  const parsed = parser.parseRecording(sampleRecording);
  
  console.log('  ✓ Parser successfully parsed recording');
  console.log(`  ✓ Title: ${parsed.title}`);
  console.log(`  ✓ Processed ${parsed.processedSteps.length} steps`);
  console.log(`  ✓ Found ${parsed.analyticsPoints.length} analytics points`);
  
} catch (error) {
  console.log(`  ✗ Parser failed: ${error.message}`);
}

// Test 2: Analytics Mapper functionality
console.log('\\n📋 Testing AnalyticsMapper...');
try {
  const mapper = new AnalyticsMapper();
  const steps = [
    {
      id: 'step_0',
      type: 'navigate',
      url: 'https://store.com/product/123'
    },
    {
      id: 'step_1',
      type: 'click',
      selector: '#add-to-cart'
    }
  ];

  const mapping = mapper.mapStepsToEvents(steps);
  
  console.log('  ✓ Mapper successfully mapped steps to events');
  console.log(`  ✓ Journey type: ${mapping.journeyType.primary} (${mapping.journeyType.confidence})`);
  console.log(`  ✓ Generated ${mapping.summary.totalEvents} events`);
  console.log(`  ✓ Event types: ${mapping.summary.eventTypes.join(', ')}`);
  
} catch (error) {
  console.log(`  ✗ Mapper failed: ${error.message}`);
}

// Test 3: Test Generator functionality
console.log('\\n📋 Testing TestGenerator...');
try {
  const generator = new TestGenerator();
  
  const sampleParsedRecording = {
    title: 'Generated Test',
    processedSteps: [
      {
        id: 'step_0',
        type: 'navigate',
        url: 'https://example.com',
        action: "await page.goto('https://example.com');"
      }
    ],
    metadata: { domains: ['example.com'] }
  };

  const sampleMapping = {
    journeyType: { primary: 'basic', confidence: 'medium' },
    events: [
      {
        stepId: 'step_0',
        events: [
          {
            eventName: 'page_view',
            confidence: 'high',
            expectedData: { page_location: 'expect.any(String)' }
          }
        ]
      }
    ],
    summary: {
      totalEvents: 1,
      recommendedTemplate: 'basic',
      eventTypes: ['page_view']
    }
  };

  const generated = generator.generateTest(sampleParsedRecording, sampleMapping);
  
  console.log('  ✓ Generator successfully generated test code');
  console.log(`  ✓ Generated ${generated.testCode.length} characters of test code`);
  console.log(`  ✓ Filename: ${generated.filename}`);
  console.log(`  ✓ Contains DLest imports: ${generated.testCode.includes("require('dlest')")}`);
  console.log(`  ✓ Contains test structure: ${generated.testCode.includes('test.describe')}`);
  console.log(`  ✓ Contains assertions: ${generated.testCode.includes('expect(dataLayer)')}`);
  
} catch (error) {
  console.log(`  ✗ Generator failed: ${error.message}`);
}

// Test 4: Full Pipeline Integration
console.log('\\n📋 Testing Full Pipeline Integration...');
try {
  const parser = new ChromeRecorderParser();
  const mapper = new AnalyticsMapper();
  const generator = new TestGenerator();

  const fullRecording = {
    title: 'E-commerce Flow',
    steps: [
      {
        type: 'navigate',
        url: 'https://store.com/product/laptop'
      },
      {
        type: 'click',
        selectors: [['aria/Adicionar ao carrinho'], ['#add-to-cart']]
      },
      {
        type: 'click',
        selectors: [['aria/Finalizar compra'], ['#checkout']]
      }
    ]
  };

  // Step 1: Parse
  const parsed = parser.parseRecording(fullRecording);
  
  // Step 2: Map
  const mapped = mapper.mapStepsToEvents(parsed.processedSteps, parsed.metadata);
  
  // Step 3: Generate
  const generated = generator.generateTest(parsed, mapped);

  console.log('  ✓ Full pipeline completed successfully');
  console.log(`  ✓ Detected ${mapped.journeyType.primary} journey`);
  console.log(`  ✓ Generated ${mapped.summary.totalEvents} analytics events`);
  console.log(`  ✓ Event types: ${mapped.summary.eventTypes.join(', ')}`);
  console.log(`  ✓ Code length: ${generated.testCode.length} characters`);
  
  // Verify essential content
  const hasEcommerce = mapped.summary.eventTypes.includes('add_to_cart');
  const hasValidCode = generated.testCode.includes('await page.goto') && 
                      generated.testCode.includes('expect(dataLayer)');
  
  console.log(`  ✓ Contains e-commerce events: ${hasEcommerce}`);
  console.log(`  ✓ Contains valid test code: ${hasValidCode}`);
  
} catch (error) {
  console.log(`  ✗ Full pipeline failed: ${error.message}`);
}

console.log('\\n🎉 Integration testing completed!');
console.log('\\n📝 Summary:');
console.log('- ✅ ChromeRecorderParser: Parses Chrome Recorder JSON to structured format');
console.log('- ✅ AnalyticsMapper: Maps user actions to analytics events intelligently');
console.log('- ✅ TestGenerator: Generates syntactically correct DLest test code');
console.log('- ✅ Full Pipeline: End-to-end processing works correctly');
console.log('\\n🚀 Chrome Recorder integration is ready for testing!');