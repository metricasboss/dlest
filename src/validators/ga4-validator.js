/**
 * GA4 Validator
 *
 * Validates Google Analytics 4 hits against official limits and best practices
 */

// GA4 Official Limits and Rules
const GA4_LIMITS = {
  // Event Name Rules
  eventName: {
    maxLength: 40,
    pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
    reservedPrefixes: ['firebase_', 'ga_', 'google_', 'gtag.'],
    // Reserved event names that shouldn't be overridden
    reserved: [
      'ad_activeview', 'ad_click', 'ad_exposure', 'ad_impression',
      'ad_query', 'ad_reward', 'adunit_exposure', 'app_clear_data',
      'app_exception', 'app_remove', 'app_store_refund', 'app_store_subscription_cancel',
      'app_store_subscription_convert', 'app_store_subscription_renew', 'app_update',
      'app_upgrade', 'dynamic_link_app_open', 'dynamic_link_app_update',
      'dynamic_link_first_open', 'error', 'firebase_campaign', 'firebase_in_app_message_action',
      'firebase_in_app_message_dismiss', 'firebase_in_app_message_impression',
      'first_open', 'first_visit', 'in_app_purchase', 'notification_dismiss',
      'notification_foreground', 'notification_open', 'notification_receive',
      'os_update', 'session_start', 'session_start_with_rollout', 'user_engagement'
    ],
    // Automatically collected events that shouldn't be manually sent
    automatic: [
      'click', 'file_download', 'form_start', 'form_submit',
      'page_view', 'scroll', 'session_start', 'user_engagement',
      'video_complete', 'video_progress', 'video_start', 'view_search_results'
    ]
  },

  // Parameter Rules
  parameters: {
    maxPerEvent: 25,
    nameMaxLength: 40,
    namePattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
    valueMaxLength: 100,
    reservedPrefixes: ['firebase_', 'ga_', 'google_'],
    // Reserved parameter names
    reserved: [
      'firebase_conversion', 'firebase_error', 'firebase_error_value',
      'firebase_event_origin', 'firebase_previous_class', 'firebase_previous_id',
      'firebase_previous_screen', 'firebase_realtime', 'firebase_screen',
      'firebase_screen_class', 'firebase_screen_id', 'ga_debug'
    ],
    // Official GA4 internal parameters (always valid)
    internalParams: [
      // Core GA4 parameters
      'v', 'tid', 'gtm', '_p', 'sr', 'ul', 'dh', 'cid', '_s', 'richsstsse',
      // Document/Page parameters
      'dl', 'dt', 'dr', '_z', '_eu', 'edid', '_dbg', 'ir', 'tt',
      // Consent parameters
      'gcs', 'gcu', 'gcut', 'gcd', '_glv', 'us_privacy', 'gdpr', 'gdpr_consent',
      // Campaign parameters
      'cm', 'cs', 'cn', 'cc', 'ck', 'ccf', 'cmt', '_rnd',
      // Event parameters
      'en', '_et', '_c', '_ee',
      // Session/User parameters
      'uid', '_fid', 'sid', 'sct', 'seg', '_fv', '_ss', '_fplc', '_nsi', '_uc', '_tu',
      // E-commerce parameters
      'cu', 'pi', 'pn', 'lo',
      // Client Hints
      'uaa', 'uab', 'uafvl', 'uamb', 'uam', 'uap', 'uapv', 'uaw',
      // Miscellaneous
      'gtm_up', '_ecid', '_uei', '_gaz', '_rdi', '_geo', 'gdid',
      // Legacy/Additional parameters (from real implementations)
      '_v', '_u', '_gid', '_r', '_slc', 'npa', 'dma', 'are', 'frm', 'pscdl', 'tag_exp', 'tfd',
      // Item parameters (dynamic)
      'id', 'br', 'ca', 'ca2', 'ca3', 'ca4', 'ca5', 'pr', 'qt', 'va', 'cp', 'ds', 'ln', 'li', 'lp', 'af'
    ]
  },

  // User Properties Rules
  userProperties: {
    maxCount: 25,
    nameMaxLength: 24,
    valueMaxLength: 36,
    namePattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
    reserved: ['first_open_time', 'first_visit_time', 'last_deep_link_referrer', 'user_id']
  },

  // Item/Product Rules (E-commerce)
  items: {
    maxPerEvent: 200,
    maxCustomParameters: 10,
    paramNameMaxLength: 40,
    paramValueMaxLength: 100
  },

  // Payload Rules
  payload: {
    maxSize: 130000, // 130KB
    maxBatchSize: 1000000, // 1MB for batch requests
    maxEventsPerBatch: 25
  },

  // Property/Stream Limits
  property: {
    maxUniqueEvents: 500,
    maxUniqueEventParameters: 50, // per event
    maxConversions: 30
  }
};

class GA4Validator {
  constructor(options = {}) {
    this.options = {
      strict: false, // If true, warnings become errors
      checkReserved: true, // Check for reserved names
      checkAutomatic: true, // Check for automatic events
      ...options
    };
    this.violations = [];
  }

  /**
   * Validate a GA4 hit
   */
  validateHit(hit) {
    this.violations = [];

    // Check for deprecated Universal Analytics
    this.validateAnalyticsVersion(hit);

    // Validate event name
    if (hit.eventName) {
      this.validateEventName(hit.eventName);
    } else {
      this.addViolation('error', 'MISSING_EVENT_NAME', 'Event name is required');
    }

    // Validate parameters
    if (hit.parameters) {
      this.validateParameters(hit.parameters);
    }

    // Validate user properties
    if (hit.userProperties) {
      this.validateUserProperties(hit.userProperties);
    }

    // Validate items (e-commerce)
    if (hit.items) {
      this.validateItems(hit.items);
    }

    // Validate payload size
    if (hit.url) {
      this.validatePayloadSize(hit.url);
    }

    return {
      valid: !this.hasErrors(),
      violations: this.violations,
      errors: this.violations.filter(v => v.severity === 'error'),
      warnings: this.violations.filter(v => v.severity === 'warning')
    };
  }

  /**
   * Validate Analytics version and detect deprecated UA
   */
  validateAnalyticsVersion(hit) {
    // Check for Universal Analytics indicators
    const isUniversalAnalytics = this.isUniversalAnalytics(hit);

    if (isUniversalAnalytics) {
      this.addViolation('error', 'DEPRECATED_UNIVERSAL_ANALYTICS',
        'Universal Analytics (UA) was discontinued on July 1, 2023. Migrate to Google Analytics 4 (GA4) immediately.', {
          measurementId: hit.measurementId,
          url: hit.url,
          discontinuedDate: '2023-07-01',
          migrationInfo: 'https://support.google.com/analytics/answer/11583528'
        });
    }

    // Check for GA4 version
    if (!isUniversalAnalytics && hit.rawParams && hit.rawParams.v) {
      const version = hit.rawParams.v;
      if (version === '1') {
        this.addViolation('warning', 'LEGACY_VERSION_PARAMETER',
          'Using legacy version parameter "v=1" in what appears to be a GA4 implementation', {
            version,
            measurementId: hit.measurementId
          });
      } else if (version !== '2') {
        this.addViolation('warning', 'UNKNOWN_VERSION_PARAMETER',
          `Unknown version parameter "v=${version}". GA4 should use "v=2"`, {
            version,
            measurementId: hit.measurementId
          });
      }
    }
  }

  /**
   * Check if hit is from Universal Analytics
   */
  isUniversalAnalytics(hit) {
    // Check measurement ID format (UA-XXXXXXX-X)
    if (hit.measurementId && hit.measurementId.startsWith('UA-')) {
      return true;
    }

    // Check URL pattern for legacy analytics
    if (hit.url && hit.url.includes('/j/collect')) {
      return true;
    }

    // Check for legacy hit type parameter
    if (hit.rawParams && hit.rawParams.t) {
      return true;
    }

    // Check for version 1 (Universal Analytics)
    if (hit.rawParams && hit.rawParams.v === '1') {
      return true;
    }

    return false;
  }

  /**
   * Validate event name
   */
  validateEventName(eventName) {
    const limits = GA4_LIMITS.eventName;

    // Check length
    if (eventName.length > limits.maxLength) {
      this.addViolation('error', 'EVENT_NAME_TOO_LONG',
        `Event name "${eventName}" has ${eventName.length} characters (max: ${limits.maxLength})`, {
          eventName,
          length: eventName.length,
          limit: limits.maxLength
        });
    }

    // Check format
    if (!limits.pattern.test(eventName)) {
      this.addViolation('error', 'EVENT_NAME_INVALID_FORMAT',
        `Event name "${eventName}" has invalid format. Must start with letter and contain only letters, numbers, and underscores`, {
          eventName,
          pattern: limits.pattern.toString()
        });
    }

    // Check reserved prefixes
    for (const prefix of limits.reservedPrefixes) {
      if (eventName.startsWith(prefix)) {
        this.addViolation('warning', 'EVENT_NAME_RESERVED_PREFIX',
          `Event name "${eventName}" uses reserved prefix "${prefix}"`, {
            eventName,
            prefix
          });
      }
    }

    // Check reserved names
    if (this.options.checkReserved && limits.reserved.includes(eventName)) {
      this.addViolation('warning', 'EVENT_NAME_RESERVED',
        `Event name "${eventName}" is reserved by GA4`, {
          eventName
        });
    }

    // Check automatic events
    if (this.options.checkAutomatic && limits.automatic.includes(eventName)) {
      this.addViolation('info', 'EVENT_NAME_AUTOMATIC',
        `Event "${eventName}" is automatically collected by GA4. Consider if manual tracking is necessary`, {
          eventName
        });
    }
  }

  /**
   * Validate parameters
   */
  validateParameters(parameters) {
    const limits = GA4_LIMITS.parameters;
    const paramCount = Object.keys(parameters).length;

    // Check parameter count
    if (paramCount > limits.maxPerEvent) {
      this.addViolation('error', 'TOO_MANY_PARAMETERS',
        `Event has ${paramCount} parameters (max: ${limits.maxPerEvent})`, {
          count: paramCount,
          limit: limits.maxPerEvent
        });
    }

    // Validate each parameter
    for (const [name, value] of Object.entries(parameters)) {
      // Skip validation for official GA4 internal parameters
      if (this.isInternalGA4Parameter(name)) {
        continue;
      }

      // Check name length
      if (name.length > limits.nameMaxLength) {
        this.addViolation('error', 'PARAMETER_NAME_TOO_LONG',
          `Parameter "${name}" has ${name.length} characters (max: ${limits.nameMaxLength})`, {
            parameter: name,
            length: name.length,
            limit: limits.nameMaxLength
          });
      }

      // Check name format
      if (!limits.namePattern.test(name)) {
        this.addViolation('error', 'PARAMETER_NAME_INVALID_FORMAT',
          `Parameter "${name}" has invalid format`, {
            parameter: name
          });
      }

      // Check value length (for strings)
      if (typeof value === 'string' && value.length > limits.valueMaxLength) {
        this.addViolation('error', 'PARAMETER_VALUE_TOO_LONG',
          `Parameter "${name}" value has ${value.length} characters (max: ${limits.valueMaxLength})`, {
            parameter: name,
            length: value.length,
            limit: limits.valueMaxLength
          });
      }

      // Check reserved parameter names
      if (this.options.checkReserved && limits.reserved.includes(name)) {
        this.addViolation('warning', 'PARAMETER_NAME_RESERVED',
          `Parameter "${name}" is reserved by GA4`, {
            parameter: name
          });
      }

      // Check reserved prefixes
      for (const prefix of limits.reservedPrefixes) {
        if (name.startsWith(prefix)) {
          this.addViolation('warning', 'PARAMETER_RESERVED_PREFIX',
            `Parameter "${name}" uses reserved prefix "${prefix}"`, {
              parameter: name,
              prefix
            });
          break;
        }
      }
    }
  }

  /**
   * Check if parameter is an official GA4 internal parameter
   */
  isInternalGA4Parameter(paramName) {
    const limits = GA4_LIMITS.parameters;

    // Check if it's in the official internal parameters list
    if (limits.internalParams.includes(paramName)) {
      return true;
    }

    // Check for dynamic patterns
    // Item parameters: pr1, pr2, ... pr200
    if (/^pr[0-9]{1,3}$/.test(paramName)) {
      const itemNum = parseInt(paramName.substring(2));
      return itemNum >= 1 && itemNum <= 200;
    }

    // Event parameters: ep.*, epn.*
    if (paramName.startsWith('ep.') || paramName.startsWith('epn.')) {
      return true;
    }

    // User properties: up.*, upn.*
    if (paramName.startsWith('up.') || paramName.startsWith('upn.')) {
      return true;
    }

    return false;
  }

  /**
   * Validate user properties
   */
  validateUserProperties(userProperties) {
    const limits = GA4_LIMITS.userProperties;
    const propCount = Object.keys(userProperties).length;

    // Check property count
    if (propCount > limits.maxCount) {
      this.addViolation('error', 'TOO_MANY_USER_PROPERTIES',
        `${propCount} user properties (max: ${limits.maxCount})`, {
          count: propCount,
          limit: limits.maxCount
        });
    }

    // Validate each property
    for (const [name, value] of Object.entries(userProperties)) {
      // Check name length
      if (name.length > limits.nameMaxLength) {
        this.addViolation('error', 'USER_PROPERTY_NAME_TOO_LONG',
          `User property "${name}" has ${name.length} characters (max: ${limits.nameMaxLength})`, {
            property: name,
            length: name.length,
            limit: limits.nameMaxLength
          });
      }

      // Check value length
      if (typeof value === 'string' && value.length > limits.valueMaxLength) {
        this.addViolation('error', 'USER_PROPERTY_VALUE_TOO_LONG',
          `User property "${name}" value has ${value.length} characters (max: ${limits.valueMaxLength})`, {
            property: name,
            length: value.length,
            limit: limits.valueMaxLength
          });
      }
    }
  }

  /**
   * Validate items (e-commerce)
   */
  validateItems(items) {
    const limits = GA4_LIMITS.items;

    // Check item count
    if (items.length > limits.maxPerEvent) {
      this.addViolation('error', 'TOO_MANY_ITEMS',
        `Event has ${items.length} items (max: ${limits.maxPerEvent})`, {
          count: items.length,
          limit: limits.maxPerEvent
        });
    }

    // Validate each item
    items.forEach((item, index) => {
      // Count custom parameters
      const standardParams = ['item_id', 'item_name', 'item_category', 'item_brand',
                            'item_variant', 'price', 'quantity', 'coupon', 'discount'];
      const customParams = Object.keys(item).filter(key => !standardParams.includes(key));

      if (customParams.length > limits.maxCustomParameters) {
        this.addViolation('warning', 'TOO_MANY_ITEM_CUSTOM_PARAMS',
          `Item ${index} has ${customParams.length} custom parameters (max: ${limits.maxCustomParameters})`, {
            itemIndex: index,
            count: customParams.length,
            limit: limits.maxCustomParameters
          });
      }
    });
  }

  /**
   * Validate payload size
   */
  validatePayloadSize(url) {
    const limits = GA4_LIMITS.payload;
    const size = new TextEncoder().encode(url).length;

    if (size > limits.maxSize) {
      this.addViolation('error', 'PAYLOAD_TOO_LARGE',
        `Payload size is ${size} bytes (max: ${limits.maxSize})`, {
          size,
          limit: limits.maxSize
        });
    } else if (size > limits.maxSize * 0.9) {
      // Warning if approaching limit
      this.addViolation('warning', 'PAYLOAD_NEAR_LIMIT',
        `Payload size is ${size} bytes, approaching limit of ${limits.maxSize}`, {
          size,
          limit: limits.maxSize
        });
    }
  }

  /**
   * Add a violation
   */
  addViolation(severity, type, message, details = {}) {
    this.violations.push({
      severity, // error, warning, info
      type,
      message,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Check if there are errors
   */
  hasErrors() {
    return this.violations.some(v => v.severity === 'error');
  }

  /**
   * Get formatted report
   */
  getReport() {
    const errors = this.violations.filter(v => v.severity === 'error');
    const warnings = this.violations.filter(v => v.severity === 'warning');
    const info = this.violations.filter(v => v.severity === 'info');

    return {
      summary: {
        total: this.violations.length,
        errors: errors.length,
        warnings: warnings.length,
        info: info.length,
        valid: errors.length === 0
      },
      errors,
      warnings,
      info
    };
  }

  /**
   * Print formatted report to console
   */
  printReport(eventName) {
    const report = this.getReport();

    console.log(`\n=== GA4 Validation Report${eventName ? ` for "${eventName}"` : ''} ===`);
    console.log(`Status: ${report.summary.valid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`Total Issues: ${report.summary.total} (${report.summary.errors} errors, ${report.summary.warnings} warnings)`);

    if (report.errors.length > 0) {
      console.log('\n❌ ERRORS (Must fix):');
      report.errors.forEach(err => {
        console.log(`  - ${err.message}`);
      });
    }

    if (report.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS (Should fix):');
      report.warnings.forEach(warn => {
        console.log(`  - ${warn.message}`);
      });
    }

    if (report.info.length > 0) {
      console.log('\nℹ️ INFO:');
      report.info.forEach(info => {
        console.log(`  - ${info.message}`);
      });
    }

    console.log('=============================\n');
  }
}

module.exports = GA4Validator;