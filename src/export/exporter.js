/**
 * Test Result Exporter
 *
 * Main orchestrator for exporting test results to cloud storage
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { S3Provider } = require('./providers/s3-provider');
const { GCSProvider } = require('./providers/gcs-provider');
const { MetadataCollector } = require('./metadata-collector');
const { JSONLFormatter } = require('./formatters/jsonl-formatter');

class TestResultExporter {
  constructor(config = {}) {
    this.config = config;
    this.exportConfig = config.export || {};
    this.metadataCollector = new MetadataCollector(config);
    this.formatter = new JSONLFormatter(this.exportConfig);
  }

  /**
   * Create provider based on configuration
   */
  createProvider() {
    const providerName = this.exportConfig.provider ||
                        process.env.DLEST_EXPORT_PROVIDER;

    if (!providerName) {
      throw new Error('Export provider not configured. Set export.provider in config or DLEST_EXPORT_PROVIDER env var');
    }

    switch (providerName.toLowerCase()) {
      case 's3':
        return new S3Provider(this.exportConfig);
      case 'gcs':
        return new GCSProvider(this.exportConfig);
      default:
        throw new Error(`Unknown export provider: ${providerName}. Supported: s3, gcs`);
    }
  }

  /**
   * Export test results to cloud storage
   * @param {Object} testData - { stats, failures, tests }
   * @param {Object} context - { config }
   */
  async export(testData, context = {}) {
    // Skip if export not enabled
    if (!this.exportConfig.enabled) {
      return;
    }

    try {
      // Collect metadata
      const metadata = this.metadataCollector.collect();

      // Format test results as JSONL
      const jsonlContent = this.formatter.format(
        {
          stats: testData.stats,
          tests: testData.tests || [],
          config: context.config,
        },
        metadata
      );

      // Resolve file path pattern
      const filePattern = this.exportConfig.fileNaming?.pattern || '{date}/{runId}.jsonl';
      const fileName = this.metadataCollector.resolveFilePattern(filePattern, metadata);

      // Add path prefix if configured
      const pathPrefix = this.exportConfig.s3?.pathPrefix ||
                        this.exportConfig.gcs?.pathPrefix ||
                        'test-results';
      const fullPath = path.posix.join(pathPrefix, fileName);

      // Create provider and upload
      const provider = this.createProvider();

      if (this.config.verbose) {
        console.log(chalk.gray(`\n📤 Exporting test results to ${provider.getName()}...`));
      }

      const result = await this.uploadWithRetry(provider, jsonlContent, fullPath);

      console.log(chalk.green(`✓ Test results exported to: ${result.path}`));

      if (this.config.verbose) {
        console.log(chalk.gray(`  URL: ${result.url}`));
      }

      return result;

    } catch (error) {
      return this.handleExportError(error, testData);
    }
  }

  /**
   * Upload with retry and timeout
   */
  async uploadWithRetry(provider, content, path) {
    const timeout = this.exportConfig.timeout || 30000;
    const retries = this.exportConfig.retries || 3;

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout')), timeout);
    });

    // Race between upload and timeout
    try {
      return await Promise.race([
        provider.upload(content, path),
        timeoutPromise,
      ]);
    } catch (error) {
      // Retry is handled inside provider.upload()
      throw error;
    }
  }

  /**
   * Handle export errors gracefully
   */
  handleExportError(error, testData) {
    console.log(chalk.yellow(`⚠️  Failed to export test results: ${error.message}`));

    // Save to local fallback
    try {
      const fallbackDir = path.join(process.cwd(), '.dlest-cache', 'failed-exports');
      fs.mkdirSync(fallbackDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fallbackFile = path.join(fallbackDir, `export-${timestamp}.json`);

      fs.writeFileSync(fallbackFile, JSON.stringify(testData, null, 2), 'utf8');

      console.log(chalk.gray(`  Saved locally to: ${fallbackFile}`));
    } catch (fallbackError) {
      console.log(chalk.gray(`  Could not save fallback: ${fallbackError.message}`));
    }

    // Fail the test run if configured
    if (this.exportConfig.failOnUploadError) {
      throw error;
    }

    return null;
  }

  /**
   * Check for security warnings
   */
  checkSecurityWarnings() {
    const hasCredentialsInConfig =
      this.exportConfig.s3?.credentials ||
      this.exportConfig.gcs?.credentials;

    if (hasCredentialsInConfig) {
      console.log(chalk.yellow('\n⚠️  SECURITY WARNING: Credentials detected in dlest.config.js'));
      console.log(chalk.yellow('   - Don\'t commit this file to git'));
      console.log(chalk.yellow('   - Use environment variables instead:'));
      console.log(chalk.yellow('     • DLEST_EXPORT_S3_ACCESS_KEY_ID'));
      console.log(chalk.yellow('     • DLEST_EXPORT_S3_SECRET_ACCESS_KEY'));
      console.log(chalk.yellow('   - Or use IAM roles in CI/CD'));
      console.log(chalk.gray('   See: https://dlest.dev/docs/export#security\n'));
    }
  }
}

module.exports = { TestResultExporter };
