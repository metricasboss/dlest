const { toHaveEvent } = require('./toHaveEvent');
const { toHaveEventData } = require('./toHaveEventData');
const toHaveGA4Event = require('./toHaveGA4Event');
const { matcherHint, printReceived, printExpected } = require('jest-matcher-utils');

/**
 * toHaveEventCount Matcher
 * 
 * Validates the count of specific events in dataLayer
 * Usage: expect(dataLayer).toHaveEventCount('page_view', 1)
 */
async function toHaveEventCount(received, eventName, expectedCount) {
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

  const events = await received.getEvents();
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
async function toHaveEventSequence(received, expectedSequence) {
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

  const events = await received.getEvents();
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
 * toBeDefined Matcher
 * 
 * Basic Jest-like matcher for checking if value is defined
 * Usage: expect(value).toBeDefined()
 */
function toBeDefined(received) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toBeDefined', 'received', '', {
    isNot,
  });

  const pass = received !== undefined && received !== null;

  if (pass) {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected value not to be defined, but received: ${printReceived(received)}`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected value to be defined, but received: ${printReceived(received)}`,
      pass: false,
    };
  }
}

/**
 * toBeUndefined Matcher
 * 
 * Basic Jest-like matcher for checking if value is undefined
 * Usage: expect(value).toBeUndefined()
 */
function toBeUndefined(received) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toBeUndefined', 'received', '', {
    isNot,
  });

  const pass = received === undefined;

  if (pass) {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected value not to be undefined, but received: ${printReceived(received)}`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected value to be undefined, but received: ${printReceived(received)}`,
      pass: false,
    };
  }
}

/**
 * toBeTruthy Matcher
 * 
 * Basic Jest-like matcher for checking if value is truthy
 * Usage: expect(value).toBeTruthy()
 */
function toBeTruthy(received) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toBeTruthy', 'received', '', {
    isNot,
  });

  const pass = Boolean(received);

  if (pass) {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected value not to be truthy, but received: ${printReceived(received)}`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected value to be truthy, but received: ${printReceived(received)}`,
      pass: false,
    };
  }
}

/**
 * toBeFalsy Matcher
 * 
 * Basic Jest-like matcher for checking if value is falsy
 * Usage: expect(value).toBeFalsy()
 */
function toBeFalsy(received) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toBeFalsy', 'received', '', {
    isNot,
  });

  const pass = !Boolean(received);

  if (pass) {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected value not to be falsy, but received: ${printReceived(received)}`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        hint + '\n\n' +
        `Expected value to be falsy, but received: ${printReceived(received)}`,
      pass: false,
    };
  }
}

/**
 * toBe Matcher
 * Basic strict equality matcher
 */
function toBe(received, expected) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toBe', 'received', 'expected', { isNot });
  const pass = Object.is(received, expected);

  return {
    pass,
    message: () =>
      hint + '\n\n' +
      (pass
        ? `Expected value not to be: ${printExpected(expected)}\nReceived: ${printReceived(received)}`
        : `Expected: ${printExpected(expected)}\nReceived: ${printReceived(received)}`),
  };
}

/**
 * toBeGreaterThan Matcher
 */
function toBeGreaterThan(received, expected) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toBeGreaterThan', 'received', 'expected', { isNot });
  const pass = received > expected;

  return {
    pass,
    message: () =>
      hint + '\n\n' +
      (pass
        ? `Expected ${printReceived(received)} not to be greater than ${printExpected(expected)}`
        : `Expected ${printReceived(received)} to be greater than ${printExpected(expected)}`),
  };
}

/**
 * toBeLessThan Matcher
 */
function toBeLessThan(received, expected) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toBeLessThan', 'received', 'expected', { isNot });
  const pass = received < expected;

  return {
    pass,
    message: () =>
      hint + '\n\n' +
      (pass
        ? `Expected ${printReceived(received)} not to be less than ${printExpected(expected)}`
        : `Expected ${printReceived(received)} to be less than ${printExpected(expected)}`),
  };
}

/**
 * toHaveLength Matcher
 */
function toHaveLength(received, expected) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toHaveLength', 'received', 'expected', { isNot });

  if (!received || typeof received.length !== 'number') {
    throw new Error(hint + '\n\nReceived value must have a length property');
  }

  const pass = received.length === expected;

  return {
    pass,
    message: () =>
      hint + '\n\n' +
      (pass
        ? `Expected value not to have length: ${printExpected(expected)}\nReceived length: ${printReceived(received.length)}`
        : `Expected length: ${printExpected(expected)}\nReceived length: ${printReceived(received.length)}`),
  };
}

/**
 * toHaveProperty Matcher
 */
function toHaveProperty(received, property, value) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toHaveProperty', 'received', 'property', { isNot });

  const hasProperty = received && Object.prototype.hasOwnProperty.call(received, property);
  const pass = value !== undefined ? (hasProperty && received[property] === value) : hasProperty;

  return {
    pass,
    message: () =>
      hint + '\n\n' +
      (pass
        ? `Expected object not to have property: ${printExpected(property)}` + (value !== undefined ? ` with value ${printExpected(value)}` : '')
        : `Expected object to have property: ${printExpected(property)}` + (value !== undefined ? ` with value ${printExpected(value)}` : '')),
  };
}

/**
 * toContain Matcher
 */
function toContain(received, expected) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toContain', 'received', 'expected', { isNot });

  let pass = false;
  if (typeof received === 'string') {
    pass = received.includes(expected);
  } else if (Array.isArray(received)) {
    pass = received.includes(expected);
  } else {
    throw new Error(hint + '\n\nReceived value must be a string or array');
  }

  return {
    pass,
    message: () =>
      hint + '\n\n' +
      (pass
        ? `Expected ${printReceived(received)} not to contain ${printExpected(expected)}`
        : `Expected ${printReceived(received)} to contain ${printExpected(expected)}`),
  };
}

/**
 * toMatch Matcher
 */
function toMatch(received, expected) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toMatch', 'received', 'expected', { isNot });

  if (typeof received !== 'string') {
    throw new Error(hint + '\n\nReceived value must be a string');
  }

  const regex = expected instanceof RegExp ? expected : new RegExp(expected);
  const pass = regex.test(received);

  return {
    pass,
    message: () =>
      hint + '\n\n' +
      (pass
        ? `Expected ${printReceived(received)} not to match ${printExpected(expected)}`
        : `Expected ${printReceived(received)} to match ${printExpected(expected)}`),
  };
}

/**
 * toThrow Matcher
 */
function toThrow(received, expected) {
  const isNot = this.isNot || false;
  const hint = matcherHint('toThrow', 'received', 'expected', { isNot });

  if (typeof received !== 'function') {
    throw new Error(hint + '\n\nReceived value must be a function');
  }

  let didThrow = false;
  let thrownError = null;

  try {
    received();
  } catch (error) {
    didThrow = true;
    thrownError = error;
  }

  let pass = didThrow;

  if (expected && didThrow) {
    if (typeof expected === 'string') {
      pass = thrownError.message.includes(expected);
    } else if (expected instanceof RegExp) {
      pass = expected.test(thrownError.message);
    } else if (typeof expected === 'function') {
      pass = thrownError instanceof expected;
    }
  }

  return {
    pass,
    message: () =>
      hint + '\n\n' +
      (pass
        ? `Expected function not to throw${expected ? ` ${printExpected(expected)}` : ''}`
        : `Expected function to throw${expected ? ` ${printExpected(expected)}` : ''}\n` +
          (didThrow ? `Threw: ${printReceived(thrownError.message)}` : 'Did not throw')),
  };
}

/**
 * All DLest custom matchers
 */
const matchers = {
  toHaveEvent,
  toHaveEventData,
  toHaveEventCount,
  toHaveEventSequence,
  toHaveGA4Event,
  toBeDefined,
  toBeUndefined,
  toBeTruthy,
  toBeFalsy,
  toBe,
  toBeGreaterThan,
  toBeLessThan,
  toHaveLength,
  toHaveProperty,
  toContain,
  toMatch,
  toThrow,
};

module.exports = matchers;