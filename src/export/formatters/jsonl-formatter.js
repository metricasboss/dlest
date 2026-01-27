/**
 * JSONL Formatter
 *
 * Format test results as JSONL (JSON Lines)
 */

class JSONLFormatter {
  constructor(config = {}) {
    this.config = config;
    this.includeOptions = config.include || {
      testResults: true,
      dataLayerEvents: true,
      networkRequests: true,
      environment: true,
      config: false,
    };
  }

  /**
   * Format test results to JSONL
   * Returns array of lines where each line is a JSON string
   */
  format(data, metadata) {
    const lines = [];

    // Line 1: Run metadata
    lines.push(this.formatRunMetadata(metadata, data.config));

    // Lines 2-N: Individual test results
    if (this.includeOptions.testResults && data.tests) {
      for (const test of data.tests) {
        lines.push(this.formatTestResult(test, metadata.runId));
      }
    }

    // Last line: Run summary
    lines.push(this.formatRunSummary(data.stats, metadata));

    // Join with newlines to create JSONL
    return lines.map(line => JSON.stringify(line)).join('\n');
  }

  /**
   * Format run metadata (first line)
   */
  formatRunMetadata(metadata, config) {
    const runMetadata = {
      type: 'run_metadata',
      runId: metadata.runId,
      timestamp: metadata.timestamp,
      environment: metadata.environment,
    };

    if (this.includeOptions.environment) {
      runMetadata.git = metadata.git;
      runMetadata.ci = metadata.ci;
      runMetadata.system = metadata.system;
    }

    if (this.includeOptions.config && config) {
      runMetadata.config = this.stripSensitiveConfig(config);
    }

    return runMetadata;
  }

  /**
   * Format individual test result
   */
  formatTestResult(test, runId) {
    const testResult = {
      type: 'test',
      runId,
      suite: test.suite || null,
      file: test.file || null,
      name: test.name,
      status: test.status,
      duration: test.duration || null,
      timestamp: test.timestamp || new Date().toISOString(),
    };

    if (test.status === 'failed') {
      testResult.error = test.error;
      testResult.tip = test.tip || null;
      testResult.stack = test.stack || null;
    }

    if (this.includeOptions.dataLayerEvents && test.dataLayerEvents) {
      testResult.dataLayerEvents = test.dataLayerEvents;
    }

    if (this.includeOptions.networkRequests && test.networkRequests) {
      testResult.networkRequests = test.networkRequests;
    }

    return testResult;
  }

  /**
   * Format run summary (last line)
   */
  formatRunSummary(stats, metadata) {
    return {
      type: 'run_summary',
      runId: metadata.runId,
      timestamp: new Date().toISOString(),
      stats: {
        total: stats.total || 0,
        passed: stats.passed || 0,
        failed: stats.failed || 0,
        skipped: stats.skipped || 0,
        duration: stats.endTime && stats.startTime
          ? stats.endTime - stats.startTime
          : null,
      },
    };
  }

  /**
   * Strip sensitive information from config before export
   */
  stripSensitiveConfig(config) {
    const safe = { ...config };

    // Remove credentials
    if (safe.export) {
      const safeExport = { ...safe.export };

      if (safeExport.s3?.credentials) {
        safeExport.s3 = {
          ...safeExport.s3,
          credentials: '[REDACTED]',
        };
      }

      if (safeExport.gcs?.credentials) {
        safeExport.gcs = {
          ...safeExport.gcs,
          credentials: '[REDACTED]',
        };
      }

      safe.export = safeExport;
    }

    // Remove auth passwords
    if (safe.auth?.password) {
      safe.auth = {
        ...safe.auth,
        password: '[REDACTED]',
      };
    }

    return safe;
  }
}

module.exports = { JSONLFormatter };
