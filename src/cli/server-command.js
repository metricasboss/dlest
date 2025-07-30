const { StaticServer } = require('../server/static-server');
const chalk = require('chalk');

/**
 * Server Command Implementation
 * 
 * Handles the 'serve' command for DLest CLI
 */

class ServerCommand {
  constructor() {
    this.server = null;
  }

  /**
   * Start static server
   */
  async serve(options = {}) {
    try {
      console.log(chalk.cyan('🚀 Starting DLest development server...\n'));

      // Find available port if requested port is taken
      let port = options.port || 3000;
      
      if (!(await StaticServer.isPortAvailable(port))) {
        console.log(chalk.yellow(`⚠️  Port ${port} is in use, finding alternative...`));
        port = await StaticServer.findAvailablePort(port);
        console.log(chalk.green(`✓ Found available port: ${port}\n`));
      }

      // Create and start server
      this.server = new StaticServer({
        port,
        root: options.root || process.cwd(),
        host: options.host || 'localhost',
        verbose: options.verbose || false,
      });

      const url = await this.server.start();

      // Setup graceful shutdown
      this.setupShutdownHandlers();

      return { 
        success: true, 
        url,
        port,
        server: this.server 
      };

    } catch (error) {
      console.error(chalk.red('❌ Failed to start server:'));
      console.error(chalk.red(error.message));
      
      if (options.verbose && error.stack) {
        console.error(chalk.gray(error.stack));
      }
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Stop server
   */
  async stop() {
    if (this.server) {
      await this.server.stop();
      this.server = null;
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupShutdownHandlers() {
    const shutdown = async (signal) => {
      console.log(chalk.yellow(`\n⏹️  Received ${signal}, shutting down server...`));
      await this.stop();
      process.exit(0);
    };

    // Handle various shutdown signals
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    // Handle uncaught exceptions gracefully
    process.on('uncaughtException', async (error) => {
      console.error(chalk.red('💥 Uncaught Exception:'));
      console.error(chalk.red(error.message));
      await this.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason) => {
      console.error(chalk.red('💥 Unhandled Rejection:'));
      console.error(chalk.red(reason));
      await this.stop();
      process.exit(1);
    });
  }

  /**
   * Start server and keep it running
   */
  async serveAndWait(options = {}) {
    const result = await this.serve(options);
    
    if (!result.success) {
      process.exit(1);
    }

    // Keep process alive until shutdown signal
    return new Promise(() => {
      // Process will be terminated by shutdown handlers
    });
  }

  /**
   * Start server temporarily for tests
   */
  async serveForTests(options = {}) {
    const result = await this.serve({
      ...options,
      verbose: false, // Less verbose for test runs
    });

    if (!result.success) {
      throw new Error(`Failed to start test server: ${result.error}`);
    }

    console.log(chalk.green(`✓ Test server started at ${result.url}`));
    return result;
  }

  /**
   * Get server info
   */
  getServerInfo() {
    if (!this.server) {
      return null;
    }

    return {
      port: this.server.port,
      host: this.server.host,
      root: this.server.root,
      url: `http://${this.server.host}:${this.server.port}`,
      running: !!this.server.server?.listening,
    };
  }

  /**
   * Create server for one-time use (useful for testing)
   */
  static async createTempServer(options = {}) {
    const server = new StaticServer({
      port: options.port || await StaticServer.findAvailablePort(3000),
      root: options.root || process.cwd(),
      host: options.host || 'localhost',
      verbose: false,
    });

    const url = await server.start();
    
    return {
      url,
      port: server.port,
      stop: () => server.stop(),
    };
  }

  /**
   * Validate server options
   */
  static validateOptions(options) {
    const errors = [];

    if (options.port && (options.port < 1 || options.port > 65535)) {
      errors.push('Port must be between 1 and 65535');
    }

    if (options.root && !require('fs').existsSync(options.root)) {
      errors.push(`Root directory does not exist: ${options.root}`);
    }

    if (options.host && !/^[a-zA-Z0-9.-]+$/.test(options.host)) {
      errors.push('Invalid host format');
    }

    return errors;
  }
}

module.exports = { ServerCommand };