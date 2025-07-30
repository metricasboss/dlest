const { toHaveEvent } = require('./toHaveEvent');
const { toHaveEventData } = require('./toHaveEventData');
const { matcherHint, printReceived, printExpected } = require('jest-matcher-utils');

/**
 * toHaveEventCount Matcher
 * 
 * Validates the count of specific events in dataLayer
 * Usage: expect(dataLayer).toHaveEventCount('page_view', 1)
 */
function toHaveEventCount(received, eventName, expectedCount) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toHaveEventCount', 'dataLayer', 'eventName, count', {
    isNot,
    promise: this.promise,
  });

  if (!received || typeof received.getEvents !== 'function') {
    throw new Error(
      hint + '\n\n' +
      'Received value must be a dataLayer object from DLest test context.\n' +
      `Received: ${printReceived(received)}`
    );
  }

  const events = received.getEvents();
  const matchingEvents = events.filter(event => {
    return event.event === eventName || 
           event.eventName === eventName ||
           event.name === eventName;
  });

  const actualCount = matchingEvents.length;
  const pass = actualCount === expectedCount;

  if (pass) {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected dataLayer not to have ${printExpected(expectedCount)} occurrence(s) of event: ${printExpected(eventName)}\n` +
        `But found exactly ${actualCount} occurrence(s).`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected dataLayer to have ${printExpected(expectedCount)} occurrence(s) of event: ${printExpected(eventName)}\n` +
        `But found ${printReceived(actualCount)} occurrence(s).\n\n` +
        `Available events: ${events.map(e => e.event || e.eventName || e.name || 'unnamed').join(', ') || 'none'}`,
      pass: false,
    };
  }
}

/**
 * toHaveEventSequence Matcher
 * 
 * Validates a sequence of events in dataLayer
 * Usage: expect(dataLayer).toHaveEventSequence(['page_view', 'add_to_cart', 'purchase'])
 */
function toHaveEventSequence(received, expectedSequence) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toHaveEventSequence', 'dataLayer', 'eventSequence', {
    isNot,
    promise: this.promise,
  });

  if (!received || typeof received.getEvents !== 'function') {
    throw new Error(
      hint + '\n\n' +
      'Received value must be a dataLayer object from DLest test context.\n' +
      `Received: ${printReceived(received)}`
    );
  }

  const events = received.getEvents();
  const eventNames = events.map(event => 
    event.event || event.eventName || event.name || 'unnamed'
  );

  // Find the sequence in the events array
  const sequenceFound = expectedSequence.every((expectedEvent, index) => {
    const startIndex = eventNames.indexOf(expectedEvent);
    if (startIndex === -1) return false;

    // Check if the rest of the sequence follows
    for (let i = 0; i < expectedSequence.length; i++) {
      if (eventNames[startIndex + i] !== expectedSequence[i]) {
        return false;
      }
    }
    return true;
  });

  const pass = sequenceFound;

  if (pass) {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected dataLayer not to have event sequence: ${printExpected(expectedSequence)}\n` +
        `But the sequence was found in events: [${eventNames.join(', ')}]`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected dataLayer to have event sequence: ${printExpected(expectedSequence)}\n` +
        `But the sequence was not found.\n\n` +
        `Actual event sequence: [${eventNames.join(', ') || 'none'}]`,
      pass: false,
    };
  }
}

/**
 * All DLest custom matchers
 */
const matchers = {
  toHaveEvent,
  toHaveEventData,
  toHaveEventCount,
  toHaveEventSequence,
};

module.exports = matchers;