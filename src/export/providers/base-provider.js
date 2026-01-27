/**
 * Base Provider Interface
 *
 * Abstract interface for cloud storage providers
 */

class BaseProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Upload content to cloud storage
   * @param {string} content - Content to upload
   * @param {string} path - Destination path in cloud storage
   * @returns {Promise<{url: string, path: string}>}
   */
  async upload(content, path) {
    throw new Error('upload() must be implemented by provider');
  }

  /**
   * Validate credentials before attempting upload
   * @returns {Promise<boolean>}
   */
  async validateCredentials() {
    throw new Error('validateCredentials() must be implemented by provider');
  }

  /**
   * Get public URL for uploaded file
   * @param {string} path - Path in cloud storage
   * @returns {string}
   */
  getPublicUrl(path) {
    throw new Error('getPublicUrl() must be implemented by provider');
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    throw new Error('getName() must be implemented by provider');
  }
}

module.exports = { BaseProvider };
