/**
 * Google Cloud Storage Provider
 *
 * Upload test results to Google Cloud Storage
 */

const { BaseProvider } = require('./base-provider');

class GCSProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.gcsConfig = config.gcs || {};
    this.storage = null;
  }

  /**
   * Initialize GCS client
   */
  async initClient() {
    if (this.storage) return this.storage;

    try {
      // Dynamic import to make it optional
      const { Storage } = require('@google-cloud/storage');

      const options = {};

      if (this.gcsConfig.projectId) {
        options.projectId = this.gcsConfig.projectId;
      }

      if (this.gcsConfig.credentials) {
        options.credentials = this.gcsConfig.credentials;
      } else if (process.env.DLEST_EXPORT_GCS_CREDENTIALS_PATH) {
        options.keyFilename = process.env.DLEST_EXPORT_GCS_CREDENTIALS_PATH;
      }

      this.storage = new Storage(options);
      return this.storage;
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error(
          'GCS provider requires @google-cloud/storage. Install it with: npm install @google-cloud/storage'
        );
      }
      throw error;
    }
  }

  /**
   * Upload content to GCS with retry logic
   */
  async upload(content, path) {
    const storage = await this.initClient();

    const bucketName = this.gcsConfig.bucket || process.env.DLEST_EXPORT_GCS_BUCKET;
    if (!bucketName) {
      throw new Error('GCS bucket not configured. Set gcs.bucket in config or DLEST_EXPORT_GCS_BUCKET env var');
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(path);

    const maxRetries = this.config.retries || 3;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await file.save(content, {
          contentType: 'application/jsonl',
          metadata: {
            cacheControl: 'public, max-age=3600',
          },
        });

        return {
          url: this.getPublicUrl(path),
          path: `gs://${bucketName}/${path}`,
        };
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`GCS upload failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Validate GCS credentials
   */
  async validateCredentials() {
    try {
      const storage = await this.initClient();
      const bucketName = this.gcsConfig.bucket || process.env.DLEST_EXPORT_GCS_BUCKET;

      const [exists] = await storage.bucket(bucketName).exists();

      if (!exists) {
        throw new Error(`GCS bucket "${bucketName}" not found`);
      }

      return true;
    } catch (error) {
      if (error.code === 403 || error.message.includes('credentials')) {
        throw new Error('GCS credentials invalid. Check config or environment variables.');
      }
      throw error;
    }
  }

  /**
   * Get public URL for GCS object
   */
  getPublicUrl(path) {
    const bucketName = this.gcsConfig.bucket || process.env.DLEST_EXPORT_GCS_BUCKET;
    return `https://storage.googleapis.com/${bucketName}/${path}`;
  }

  getName() {
    return 'gcs';
  }
}

module.exports = { GCSProvider };
