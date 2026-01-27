const { matcherHint, printExpected, printReceived } = require('jest-matcher-utils');
const GA4Validator = require('../validators/ga4-validator');

/**
 * Custom matcher to check if a GA4 event was sent and validate it
 *
 * Usage:
 * expect(network).toHaveGA4Event('purchase')
 * expect(network).toHaveGA4Event('purchase', { value: 100 })
 * expect(network).toHaveGA4Event('purchase', { valid: true })
 */
async function toHaveGA4Event(networkSpy, eventName, options = {}) {
  const {
    parameters = null,
    valid = null, // null = don't check, true = must be valid, false = must have errors
    timeout = 5000,
    validateOnly = false, // if true, only validate without checking existence
    strict = false // if true, warnings become errors
  } = options;

  // Check if networkSpy is valid
  if (!networkSpy || typeof networkSpy.getGA4EventsByName !== 'function') {
    return {
      pass: false,
      message: () =>
        matcherHint('toHaveGA4Event', 'network', eventName) +
        '\n\n' +
        'Expected network spy object but received:\n' +
        `  ${printReceived(networkSpy)}\n\n` +
        'Make sure you are using the network object from the test context:\n' +
        '  test("my test", async ({ page, dataLayer, network }) => {\n' +
        '    await expect(network).toHaveGA4Event("event_name");\n' +
        '  });'
    };
  }

  // Wait for event if needed (with timeout)
  const startTime = Date.now();
  let events = [];

  while (Date.now() - startTime < timeout) {
    events = networkSpy.getGA4EventsByName(eventName);
    if (events.length > 0) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Check if event was found
  const eventFound = events.length > 0;

  if (!validateOnly && !eventFound) {
    const allEvents = networkSpy.getGA4Events();
    const allEventNames = allEvents.map(event => event.eventName || 'unnamed');

    return {
      pass: false,
      message: () =>
        matcherHint('toHaveGA4Event', 'network', eventName) +
        '\n\n' +
        `Expected GA4 event with name: ${printExpected(eventName)}\n` +
        `But no such event was captured.\n\n` +
        (allEventNames.length > 0
          ? `Captured events: ${allEventNames.join(', ')}`
          : 'No GA4 events were captured') +
        '\n\n' +
        'Debugging tips:\n' +
        '  1. Check if GA4 is properly initialized on the page\n' +
        '  2. Verify the event name is correct\n' +
        '  3. Ensure the event fires after page actions\n' +
        '  4. Try increasing the timeout if event is async'
    };
  }

  // Get the most recent event for this event name
  const event = events[events.length - 1];

  // Check parameters if specified
  if (parameters !== null) {
    const actualParams = event.parameters || {};

    // Check each expected parameter
    for (const [key, expectedValue] of Object.entries(parameters)) {
      const actualValue = actualParams[key];

      if (actualValue === undefined) {
        return {
          pass: false,
          message: () =>
            matcherHint('toHaveGA4Event', 'network', eventName) +
            '\n\n' +
            `GA4 event "${eventName}" was found but parameter "${key}" is missing.\n\n` +
            `Expected parameters: ${printExpected(parameters)}\n` +
            `Actual parameters: ${printReceived(actualParams)}`
        };
      }

      // Check value if not using expect matchers
      if (expectedValue !== null &&
          typeof expectedValue !== 'object' &&
          actualValue !== expectedValue) {
        return {
          pass: false,
          message: () =>
            matcherHint('toHaveGA4Event', 'network', eventName) +
            '\n\n' +
            `GA4 event "${eventName}" parameter "${key}" mismatch.\n\n` +
            `Expected: ${printExpected(expectedValue)}\n` +
            `Received: ${printReceived(actualValue)}`
        };
      }
    }
  }

  // Validate the event against GA4 rules
  const validator = new GA4Validator({ strict });
  const validation = validator.validateHit(event);

  // Check validation if specified
  if (valid !== null) {
    if (valid === true && !validation.valid) {
      // Expected valid but has errors
      const errorMessages = validation.errors.map(e => `  - ${e.message}`).join('\n');
      const warningMessages = validation.warnings.map(w => `  - ${w.message}`).join('\n');

      return {
        pass: false,
        message: () =>
          matcherHint('toHaveGA4Event', 'network', eventName) +
          '\n\n' +
          `GA4 event "${eventName}" was found but has validation errors:\n\n` +
          (errorMessages ? `❌ Errors:\n${errorMessages}\n\n` : '') +
          (warningMessages && strict ? `⚠️ Warnings (strict mode):\n${warningMessages}\n\n` : '') +
          'Fix these issues to ensure proper GA4 tracking.'
      };
    }

    if (valid === false && validation.valid) {
      // Expected errors but is valid
      return {
        pass: false,
        message: () =>
          matcherHint('toHaveGA4Event', 'network', eventName) +
          '\n\n' +
          `Expected GA4 event "${eventName}" to have validation errors, but it is valid.`
      };
    }
  }

  // Build success message
  let successDetails = [`✅ Event "${eventName}" was sent to GA4`];

  if (parameters !== null) {
    successDetails.push('✅ Parameters match expected values');
  }

  if (validation.valid) {
    successDetails.push('✅ Event passes GA4 validation');
  } else {
    if (validation.errors.length > 0) {
      successDetails.push(`⚠️ Event has ${validation.errors.length} validation errors`);
    }
    if (validation.warnings.length > 0) {
      successDetails.push(`ℹ️ Event has ${validation.warnings.length} warnings`);
    }
  }

  return {
    pass: true,
    message: () =>
      matcherHint('toHaveGA4Event', 'network', eventName) +
      '\n\n' +
      successDetails.join('\n') +
      '\n\n' +
      `Event details:\n` +
      `  Name: ${event.eventName}\n` +
      `  Parameters: ${JSON.stringify(event.parameters, null, 2)}\n` +
      (event.items ? `  Items: ${event.items.length} products\n` : '') +
      (validation.errors.length > 0 ?
        `\n⚠️ Validation issues:\n${validation.errors.map(e => `  - ${e.message}`).join('\n')}` : '')
  };
}

// Negative matcher (not.toHaveGA4Event)
toHaveGA4Event.negated = async function(networkSpy, eventName) {
  if (!networkSpy || typeof networkSpy.getGA4EventsByName !== 'function') {
    return {
      pass: true, // Negative case passes if network spy is invalid
      message: () => 'Network spy is not properly initialized'
    };
  }

  const events = networkSpy.getGA4EventsByName(eventName);
  const eventFound = events.length > 0;

  if (eventFound) {
    return {
      pass: false,
      message: () =>
        matcherHint('.not.toHaveGA4Event', 'network', eventName) +
        '\n\n' +
        `Expected NO GA4 event with name: ${printExpected(eventName)}\n` +
        `But found ${events.length} event(s) for this name.\n\n` +
        `Event details: ${JSON.stringify(events[0], null, 2)}`
    };
  }

  return {
    pass: true,
    message: () =>
      matcherHint('.not.toHaveGA4Event', 'network', eventName) +
      '\n\n' +
      `✅ No GA4 event found for name "${eventName}"`
  };
};

module.exports = toHaveGA4Event;