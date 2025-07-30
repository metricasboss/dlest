const { matcherHint, printReceived, printExpected } = require('jest-matcher-utils');

/**
 * toHaveEventData Matcher
 * 
 * Validates specific data within any event in the dataLayer
 * Usage: expect(dataLayer).toHaveEventData({ currency: 'BRL', value: 99.90 })
 */

function toHaveEventData(received, expectedData) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toHaveEventData', 'dataLayer', 'expectedData', {
    isNot,
    promise: this.promise,
  });

  // Validate received is a dataLayer proxy
  if (!received || typeof received.getEvents !== 'function') {
    throw new Error(
      hint + '\n\n' +
      'Received value must be a dataLayer object from DLest test context.\n' +
      `Received: ${printReceived(received)}`
    );
  }

  // Get all captured events
  const events = received.getEvents();

  if (events.length === 0) {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected dataLayer to contain event data: ${printExpected(expectedData)}\n` +
        `But no events were found in dataLayer.`,
      pass: false,
    };
  }

  // Check if any event contains the expected data
  const matchingEvent = events.find(event => {
    return Object.keys(expectedData).every(key => {
      const expectedValue = expectedData[key];
      const actualValue = event[key];

      // Handle special Jest matchers
      if (expectedValue && typeof expectedValue === 'object' && expectedValue.asymmetricMatch) {
        return expectedValue.asymmetricMatch(actualValue);
      }

      // Handle deep object comparison
      if (typeof expectedValue === 'object' && expectedValue !== null) {
        if (typeof actualValue !== 'object' || actualValue === null) {
          return false;
        }
        return JSON.stringify(actualValue) === JSON.stringify(expectedValue);
      }

      return actualValue === expectedValue;
    });
  });

  const pass = !!matchingEvent;

  if (pass) {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected dataLayer not to contain event data: ${printExpected(expectedData)}\n` +
        `But found matching event:\n${printReceived(matchingEvent)}`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected dataLayer to contain event data: ${printExpected(expectedData)}\n` +
        `But no events matched the expected data.\n\n` +
        `Available events:\n` +
        events.map((event, index) => 
          `Event ${index + 1}: ${printReceived(event)}`
        ).join('\n'),
      pass: false,
    };
  }
}

module.exports = { toHaveEventData };