/**
 * Metadata Collector
 *
 * Collect metadata about the test run environment
 */

const { execSync } = require('child_process');
const os = require('os');
const path = require('path');

class MetadataCollector {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Generate unique run ID
   * Format: YYYYMMDDHHMMSS-abc123
   */
  generateRunId() {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace(/\..+/, '')
      .replace('T', '');

    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  /**
   * Get git information
   */
  getGitInfo() {
    try {
      const branch = this.execGit('git rev-parse --abbrev-ref HEAD');
      const commit = this.execGit('git rev-parse HEAD');
      const shortCommit = this.execGit('git rev-parse --short HEAD');
      const message = this.execGit('git log -1 --pretty=%B');
      const author = this.execGit('git log -1 --pretty=%an');
      const email = this.execGit('git log -1 --pretty=%ae');
      const timestamp = this.execGit('git log -1 --pretty=%ai');

      // Check for uncommitted changes
      const status = this.execGit('git status --porcelain');
      const isDirty = status.trim().length > 0;

      return {
        branch,
        commit,
        shortCommit,
        message: message.trim(),
        author,
        email,
        timestamp,
        isDirty,
      };
    } catch (error) {
      // Not a git repository or git not available
      return {
        branch: 'unknown',
        commit: 'unknown',
        shortCommit: 'unknown',
        message: '',
        author: '',
        email: '',
        timestamp: '',
        isDirty: false,
      };
    }
  }

  /**
   * Execute git command and return trimmed output
   */
  execGit(command) {
    try {
      return execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'] // Suppress stderr
      }).trim();
    } catch (error) {
      return '';
    }
  }

  /**
   * Get CI environment information
   */
  getCIInfo() {
    const ciProviders = {
      GITHUB_ACTIONS: 'github-actions',
      GITLAB_CI: 'gitlab-ci',
      CIRCLECI: 'circleci',
      TRAVIS: 'travis',
      JENKINS_URL: 'jenkins',
      BUILDKITE: 'buildkite',
    };

    for (const [envVar, provider] of Object.entries(ciProviders)) {
      if (process.env[envVar]) {
        return {
          provider,
          isPR: !!(process.env.GITHUB_EVENT_NAME === 'pull_request' ||
                    process.env.CI_MERGE_REQUEST_ID ||
                    process.env.CIRCLE_PULL_REQUEST),
          buildNumber: process.env.GITHUB_RUN_NUMBER ||
                       process.env.CI_PIPELINE_ID ||
                       process.env.CIRCLE_BUILD_NUM ||
                       process.env.BUILD_NUMBER,
        };
      }
    }

    return {
      provider: process.env.CI === 'true' ? 'unknown' : null,
      isPR: false,
      buildNumber: null,
    };
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      hostname: os.hostname(),
    };
  }

  /**
   * Get environment type (ci, local, etc)
   */
  getEnvironment() {
    if (process.env.CI === 'true') return 'ci';
    if (process.env.NODE_ENV === 'production') return 'production';
    if (process.env.NODE_ENV === 'development') return 'development';
    return 'local';
  }

  /**
   * Collect all metadata
   */
  collect(runId = null) {
    const id = runId || this.generateRunId();
    const git = this.getGitInfo();
    const ci = this.getCIInfo();
    const system = this.getSystemInfo();
    const environment = this.getEnvironment();

    return {
      runId: id,
      timestamp: new Date().toISOString(),
      environment,
      git,
      ci,
      system,
    };
  }

  /**
   * Resolve file naming pattern with tokens
   * Tokens: {date}, {runId}, {branch}, {commit}, {env}
   */
  resolveFilePattern(pattern, metadata) {
    const tokens = {
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      runId: metadata.runId,
      branch: metadata.git.branch,
      commit: metadata.git.shortCommit,
      env: metadata.environment,
    };

    let resolved = pattern;
    for (const [key, value] of Object.entries(tokens)) {
      resolved = resolved.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return resolved;
  }
}

module.exports = { MetadataCollector };
