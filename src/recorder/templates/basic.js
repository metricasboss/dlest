/**
 * Basic Template for DLest Test Generation
 * 
 * Simple, general-purpose template for any type of user journey
 */

const BasicTemplate = {
  name: 'Basic Template',
  description: 'Simple, general-purpose template for any type of user journey',
  
  /**
   * Generate test structure for basic journeys
   */
  generateTest(parsedRecording, analyticsMapping, config) {
    const testName = config.testName || 'should track user interactions correctly';
    
    return {
      headerComment: this.generateBasicHeader(parsedRecording, analyticsMapping),
      testStructure: 'simple', // Simple test without describe block
      testName: testName,
      focusAreas: {
        interactions: this.hasInteractionEvents(analyticsMapping),
        navigation: this.hasNavigationEvents(analyticsMapping),
        forms: this.hasFormEvents(analyticsMapping)
      }
    };
  },

  /**
   * Generate basic header
   */
  generateBasicHeader(parsedRecording, analyticsMapping) {
    const lines = [
      '/**',
      ` * Auto-generated DLest test from user journey recording`,
      ` * Original: ${parsedRecording.title}`,
      ` * `,
      ` * This test validates analytics tracking for user interactions.`,
      ` * Review the assertions and adjust based on your analytics setup.`,
      ` * `,
      ` * TODO: Verify event names match your implementation`,
      ` * TODO: Update expected data based on your dataLayer structure`,
      ` */'
    ];
    
    return lines.join('\n');
  },

  /**
   * Check for interaction events
   */
  hasInteractionEvents(analyticsMapping) {
    return analyticsMapping.events.some(mapping => 
      mapping.events.some(event => 
        event.eventName === 'click' || event.eventName === 'button_click'
      )
    );
  },

  /**
   * Check for navigation events
   */
  hasNavigationEvents(analyticsMapping) {
    return analyticsMapping.events.some(mapping => 
      mapping.events.some(event => event.eventName === 'page_view')
    );
  },

  /**
   * Check for form events
   */
  hasFormEvents(analyticsMapping) {
    return analyticsMapping.events.some(mapping => 
      mapping.events.some(event => 
        event.eventName === 'form_submit' || event.eventName === 'form_interaction'
      )
    );
  }
};

module.exports = { BasicTemplate };