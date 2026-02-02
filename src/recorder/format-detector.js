/**
 * Format Detector
 *
 * Detects whether a recording JSON is from Chrome DevTools Recorder
 * or Puppeteer Replay format
 */

class FormatDetector {
  /**
   * Detect recording format from JSON
   * @param {Object|string} recordingJson - Recording JSON object or string
   * @returns {{ format: 'chrome-recorder' | 'puppeteer-replay', confidence: 'high' | 'medium' | 'low' }}
   */
  static detect(recordingJson) {
    try {
      // Parse if string
      const recording = typeof recordingJson === 'string'
        ? JSON.parse(recordingJson)
        : recordingJson;

      // Validate basic structure
      if (!recording || typeof recording !== 'object') {
        throw new Error('Invalid recording: must be a valid object');
      }

      if (!Array.isArray(recording.steps)) {
        throw new Error('Invalid recording: missing steps array');
      }

      if (recording.steps.length === 0) {
        throw new Error('Invalid recording: steps array is empty');
      }

      // Run detection heuristics
      const indicators = this.analyzeIndicators(recording);

      // Determine format based on indicators
      return this.determineFormat(indicators);

    } catch (error) {
      throw new Error(`Failed to detect recording format: ${error.message}`);
    }
  }

  /**
   * Analyze indicators from recording structure
   * @private
   */
  static analyzeIndicators(recording) {
    const indicators = {
      chromeRecorder: 0,
      puppeteerReplay: 0,
      neutral: 0
    };

    // Check selector format (most reliable indicator)
    const selectorFormat = this.analyzeSelectorFormat(recording.steps);
    if (selectorFormat === 'nested-array') {
      indicators.chromeRecorder += 3; // High weight
    } else if (selectorFormat === 'simple-array') {
      indicators.puppeteerReplay += 3; // High weight
    } else {
      indicators.neutral += 1;
    }

    // Check for Puppeteer-specific step types
    const puppeteerTypes = ['change', 'doubleClick', 'waitForExpression', 'emulateNetworkConditions', 'close'];
    const hasPuppeteerTypes = recording.steps.some(step =>
      puppeteerTypes.includes(step.type)
    );
    if (hasPuppeteerTypes) {
      indicators.puppeteerReplay += 2;
    }

    // Check for Chrome Recorder specific step types
    const chromeTypes = ['fill']; // 'fill' is more common in Chrome Recorder
    const hasChromeTypes = recording.steps.some(step =>
      chromeTypes.includes(step.type)
    );
    if (hasChromeTypes) {
      indicators.chromeRecorder += 1;
    }

    // Check viewport structure
    const viewportStep = recording.steps.find(step => step.type === 'setViewport');
    if (viewportStep) {
      // Puppeteer has more fields in viewport
      const puppeteerViewportFields = ['deviceScaleFactor', 'isMobile', 'hasTouch', 'isLandscape'];
      const hasPuppeteerViewportFields = puppeteerViewportFields.some(
        field => viewportStep[field] !== undefined
      );

      if (hasPuppeteerViewportFields) {
        indicators.puppeteerReplay += 2;
      } else if (viewportStep.width && viewportStep.height) {
        // Simple viewport structure suggests Chrome Recorder
        indicators.chromeRecorder += 1;
      }
    }

    // Check for assertedEvents (Chrome Recorder specific)
    const hasAssertedEvents = recording.steps.some(step =>
      step.assertedEvents && Array.isArray(step.assertedEvents)
    );
    if (hasAssertedEvents) {
      indicators.chromeRecorder += 2;
    }

    return indicators;
  }

  /**
   * Analyze selector format across steps
   * @private
   * @returns {'nested-array' | 'simple-array' | 'mixed' | 'none'}
   */
  static analyzeSelectorFormat(steps) {
    const stepsWithSelectors = steps.filter(step =>
      Array.isArray(step.selectors) && step.selectors.length > 0
    );

    if (stepsWithSelectors.length === 0) {
      return 'none';
    }

    let nestedArrayCount = 0;
    let simpleArrayCount = 0;

    stepsWithSelectors.forEach(step => {
      const firstSelector = step.selectors[0];

      // Check if nested array format: [["selector1"], ["selector2"]]
      if (Array.isArray(firstSelector)) {
        nestedArrayCount++;
      }
      // Check if simple array format: ["selector1", "selector2"]
      else if (typeof firstSelector === 'string') {
        simpleArrayCount++;
      }
    });

    // Determine predominant format
    if (nestedArrayCount > simpleArrayCount) {
      return 'nested-array';
    } else if (simpleArrayCount > nestedArrayCount) {
      return 'simple-array';
    } else {
      return 'mixed';
    }
  }

  /**
   * Determine format and confidence from indicators
   * @private
   */
  static determineFormat(indicators) {
    const chromeScore = indicators.chromeRecorder;
    const puppeteerScore = indicators.puppeteerReplay;
    const neutralScore = indicators.neutral;

    // Calculate total and difference
    const total = chromeScore + puppeteerScore + neutralScore;
    const difference = Math.abs(chromeScore - puppeteerScore);

    let format;
    let confidence;

    // Determine format
    if (chromeScore > puppeteerScore) {
      format = 'chrome-recorder';
    } else if (puppeteerScore > chromeScore) {
      format = 'puppeteer-replay';
    } else {
      // Tie - default to chrome-recorder (backwards compatibility)
      format = 'chrome-recorder';
    }

    // Determine confidence based on score difference and total
    if (difference >= 3 && total >= 5) {
      confidence = 'high';
    } else if (difference >= 2 && total >= 3) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return { format, confidence };
  }

  /**
   * Get detailed analysis for debugging
   * @param {Object|string} recordingJson
   * @returns {Object} Detailed analysis
   */
  static analyzeDetailed(recordingJson) {
    const recording = typeof recordingJson === 'string'
      ? JSON.parse(recordingJson)
      : recordingJson;

    const indicators = this.analyzeIndicators(recording);
    const selectorFormat = this.analyzeSelectorFormat(recording.steps);
    const detection = this.determineFormat(indicators);

    return {
      ...detection,
      indicators,
      selectorFormat,
      stepsCount: recording.steps.length,
      stepTypes: [...new Set(recording.steps.map(s => s.type))]
    };
  }
}

module.exports = { FormatDetector };
