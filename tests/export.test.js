/**
 * Cloud Export Tests
 *
 * Test export functionality (formatters, metadata, etc)
 */

describe('Cloud Export', () => {
  test('metadata collector generates run ID', async () => {
    const { MetadataCollector } = require('../src/export/metadata-collector');
    const collector = new MetadataCollector();

    const runId = collector.generateRunId();

    // Format: YYYYMMDDHHMMSS-abc123
    expect(runId).toBeDefined();
    expect(typeof runId).toBe('string');
    expect(runId.length).toBeGreaterThan(15);
    expect(runId).toMatch(/^\d{14}-[a-z0-9]+$/);
  });

  test('metadata collector gets git info', async () => {
    const { MetadataCollector } = require('../src/export/metadata-collector');
    const collector = new MetadataCollector();

    const gitInfo = collector.getGitInfo();

    expect(gitInfo).toBeDefined();
    expect(gitInfo.branch).toBeDefined();
    expect(gitInfo.commit).toBeDefined();

    // In this repo, we should have git info
    expect(gitInfo.branch).toBe('main');
  });

  test('metadata collector gets system info', async () => {
    const { MetadataCollector } = require('../src/export/metadata-collector');
    const collector = new MetadataCollector();

    const systemInfo = collector.getSystemInfo();

    expect(systemInfo).toBeDefined();
    expect(systemInfo.platform).toBeDefined();
    expect(systemInfo.nodeVersion).toBeDefined();
    expect(systemInfo.cpus).toBeGreaterThan(0);
  });

  test('metadata collector resolves file patterns', async () => {
    const { MetadataCollector } = require('../src/export/metadata-collector');
    const collector = new MetadataCollector();

    const metadata = {
      runId: '20240127120000-abc123',
      git: { branch: 'main', shortCommit: 'ba8ec8a' },
      environment: 'ci'
    };

    const resolved = collector.resolveFilePattern('{date}/{runId}.jsonl', metadata);

    expect(resolved).toMatch(/^\d{4}-\d{2}-\d{2}\/20240127120000-abc123\.jsonl$/);
  });

  test('JSONL formatter formats run metadata', async () => {
    const { JSONLFormatter } = require('../src/export/formatters/jsonl-formatter');
    const formatter = new JSONLFormatter();

    const metadata = {
      runId: 'test-run-123',
      timestamp: '2024-01-27T12:00:00Z',
      environment: 'ci',
      git: { branch: 'main' },
      ci: { provider: 'github-actions' },
      system: { platform: 'linux' }
    };

    const formatted = formatter.formatRunMetadata(metadata);

    expect(formatted.type).toBe('run_metadata');
    expect(formatted.runId).toBe('test-run-123');
    expect(formatted.environment).toBe('ci');
    expect(formatted.git.branch).toBe('main');
  });

  test('JSONL formatter formats test results', async () => {
    const { JSONLFormatter } = require('../src/export/formatters/jsonl-formatter');
    const formatter = new JSONLFormatter();

    const testData = {
      suite: 'E-commerce',
      name: 'product view',
      status: 'passed',
      duration: 1234,
      timestamp: '2024-01-27T12:00:00Z'
    };

    const formatted = formatter.formatTestResult(testData, 'run-123');

    expect(formatted.type).toBe('test');
    expect(formatted.runId).toBe('run-123');
    expect(formatted.suite).toBe('E-commerce');
    expect(formatted.name).toBe('product view');
    expect(formatted.status).toBe('passed');
    expect(formatted.duration).toBe(1234);
  });

  test('JSONL formatter strips sensitive config', async () => {
    const { JSONLFormatter } = require('../src/export/formatters/jsonl-formatter');
    const formatter = new JSONLFormatter();

    const config = {
      export: {
        s3: {
          bucket: 'my-bucket',
          credentials: {
            accessKeyId: 'AKIA...',
            secretAccessKey: 'secret123'
          }
        },
        gcs: {
          bucket: 'my-bucket',
          credentials: { key: 'value' }
        }
      },
      auth: {
        username: 'user',
        password: 'password123'
      }
    };

    const safe = formatter.stripSensitiveConfig(config);

    expect(safe.export.s3.credentials).toBe('[REDACTED]');
    expect(safe.export.gcs.credentials).toBe('[REDACTED]');
    expect(safe.auth.password).toBe('[REDACTED]');
    expect(safe.export.s3.bucket).toBe('my-bucket'); // Non-sensitive data preserved
  });

  test('JSONL formatter creates complete JSONL output', async () => {
    const { JSONLFormatter } = require('../src/export/formatters/jsonl-formatter');
    const formatter = new JSONLFormatter();

    const data = {
      stats: { total: 2, passed: 1, failed: 1, startTime: 1000, endTime: 2000 },
      tests: [
        { name: 'test1', status: 'passed', duration: 100 },
        { name: 'test2', status: 'failed', duration: 200, error: 'Failed' }
      ]
    };

    const metadata = {
      runId: 'run-123',
      timestamp: '2024-01-27T12:00:00Z',
      environment: 'local',
      git: { branch: 'main' }
    };

    const jsonl = formatter.format(data, metadata);

    // Should be JSONL: each line is valid JSON
    const lines = jsonl.split('\n');
    expect(lines.length).toBe(4); // metadata + 2 tests + summary

    // Parse each line to verify valid JSON
    const parsed = lines.map(line => JSON.parse(line));

    expect(parsed[0].type).toBe('run_metadata');
    expect(parsed[1].type).toBe('test');
    expect(parsed[1].status).toBe('passed');
    expect(parsed[2].type).toBe('test');
    expect(parsed[2].status).toBe('failed');
    expect(parsed[3].type).toBe('run_summary');
    expect(parsed[3].stats.total).toBe(2);
  });
});
