const { matcherHint, printReceived, printExpected } = require('jest-matcher-utils');

/**
 * toHaveEvent Matcher
 * 
 * Validates that dataLayer contains specific events
 * Usage: expect(dataLayer).toHaveEvent('purchase', { value: 99.90 })
 */

function toHaveEvent(received, eventName, eventData) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toHaveEvent', 'dataLayer', 'eventName, eventData', {
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
  
  // Find events matching the name
  const matchingEvents = events.filter(event => {
    return event.event === eventName || 
           event.eventName === eventName ||
           event.name === eventName;
  });

  const hasMatchingEvent = matchingEvents.length > 0;

  // If no eventData specified, just check event name
  if (!eventData) {
    const pass = hasMatchingEvent;
    
    if (pass) {
      return {
        message: () =>
          hint + '\n\n' +
          `Expected dataLayer not to have event: ${printExpected(eventName)}\n` +
          `But found ${matchingEvents.length} occurrence(s):\n` +
          matchingEvents.map(event => printReceived(event)).join('\n'),
        pass: true,
      };
    } else {
      return {
        message: () =>
          hint + '\n\n' +
          `Expected dataLayer to have event: ${printExpected(eventName)}\n` +
          `But event was not found.\n\n` +
          `Available events: ${events.map(e => e.event || e.eventName || e.name || 'unnamed').join(', ') || 'none'}`,
        pass: false,
      };
    }
  }

  // Check if any matching event has the expected data
  const hasMatchingData = matchingEvents.some(event => {
    return Object.keys(eventData).every(key => {
      const expectedValue = eventData[key];
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

  const pass = hasMatchingEvent && hasMatchingData;

  if (pass) {
    const matchingEvent = matchingEvents.find(event => {
      return Object.keys(eventData).every(key => {
        const expectedValue = eventData[key];
        const actualValue = event[key];

        if (expectedValue && typeof expectedValue === 'object' && expectedValue.asymmetricMatch) {
          return expectedValue.asymmetricMatch(actualValue);
        }

        if (typeof expectedValue === 'object' && expectedValue !== null) {
          if (typeof actualValue !== 'object' || actualValue === null) {
            return false;
          }
          return JSON.stringify(actualValue) === JSON.stringify(expectedValue);
        }

        return actualValue === expectedValue;
      });
    });

    return {
      message: () =>
        hint + '\n\n' +
        `Expected dataLayer not to have event: ${printExpected(eventName)}\n` +
        `With data: ${printExpected(eventData)}\n` +
        `But found matching event:\n${printReceived(matchingEvent)}`,
      pass: true,
    };
  } else {
    if (!hasMatchingEvent) {
      return {
        message: () =>
          hint + '\n\n' +
          `Expected dataLayer to have event: ${printExpected(eventName)}\n` +
          `With data: ${printExpected(eventData)}\n` +
          `But event was not found.\n\n` +
          `Available events: ${events.map(e => e.event || e.eventName || e.name || 'unnamed').join(', ') || 'none'}`,
        pass: false,
      };
    } else {
      return {
        message: () =>
          hint + '\n\n' +
          `Expected dataLayer to have event: ${printExpected(eventName)}\n` +
          `With data: ${printExpected(eventData)}\n` +
          `Found ${matchingEvents.length} event(s) with name '${eventName}' but none matched the expected data:\n\n` +
          matchingEvents.map((event, index) => 
            `Event ${index + 1}:\n${printReceived(event)}`
          ).join('\n\n'),
        pass: false,
      };
    }
  }
}

module.exports = { toHaveEvent };