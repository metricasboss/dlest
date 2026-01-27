/**
 * AWS S3 Provider
 *
 * Upload test results to AWS S3
 */

const { BaseProvider } = require('./base-provider');

class S3Provider extends BaseProvider {
  constructor(config) {
    super(config);
    this.s3Config = config.s3 || {};
    this.client = null;
  }

  /**
   * Initialize S3 client
   */
  async initClient() {
    if (this.client) return this.client;

    try {
      // Dynamic import to make it optional
      const { S3Client } = require('@aws-sdk/client-s3');

      this.client = new S3Client({
        region: this.s3Config.region || 'us-east-1',
        credentials: this.s3Config.credentials || {
          accessKeyId: process.env.DLEST_EXPORT_S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.DLEST_EXPORT_S3_SECRET_ACCESS_KEY,
        },
      });

      return this.client;
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error(
          'S3 provider requires @aws-sdk/client-s3. Install it with: npm install @aws-sdk/client-s3'
        );
      }
      throw error;
    }
  }

  /**
   * Upload content to S3 with retry logic
   */
  async upload(content, path) {
    const client = await this.initClient();
    const { PutObjectCommand } = require('@aws-sdk/client-s3');

    const bucket = this.s3Config.bucket || process.env.DLEST_EXPORT_S3_BUCKET;
    if (!bucket) {
      throw new Error('S3 bucket not configured. Set s3.bucket in config or DLEST_EXPORT_S3_BUCKET env var');
    }

    const params = {
      Bucket: bucket,
      Key: path,
      Body: content,
      ContentType: 'application/jsonl',
    };

    const maxRetries = this.config.retries || 3;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await client.send(new PutObjectCommand(params));

        return {
          url: this.getPublicUrl(path),
          path: `s3://${bucket}/${path}`,
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

    throw new Error(`S3 upload failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Validate S3 credentials
   */
  async validateCredentials() {
    try {
      const client = await this.initClient();
      const { HeadBucketCommand } = require('@aws-sdk/client-s3');

      const bucket = this.s3Config.bucket || process.env.DLEST_EXPORT_S3_BUCKET;
      await client.send(new HeadBucketCommand({ Bucket: bucket }));

      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        throw new Error(`S3 bucket "${this.s3Config.bucket}" not found`);
      }
      if (error.name === 'Forbidden' || error.message.includes('credentials')) {
        throw new Error('S3 credentials invalid. Check config or environment variables.');
      }
      throw error;
    }
  }

  /**
   * Get public URL for S3 object
   */
  getPublicUrl(path) {
    const bucket = this.s3Config.bucket || process.env.DLEST_EXPORT_S3_BUCKET;
    const region = this.s3Config.region || process.env.DLEST_EXPORT_S3_REGION || 'us-east-1';

    return `https://${bucket}.s3.${region}.amazonaws.com/${path}`;
  }

  getName() {
    return 's3';
  }
}

module.exports = { S3Provider };
