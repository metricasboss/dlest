const { Command } = require('commander');
const { Commands } = require('./commands');
const { ServerCommand } = require('./server-command');
const chalk = require('chalk');
const path = require('path');

/**
 * CLI Runner
 * 
 * Main CLI interface for DLest
 */

class CLIRunner {
  constructor() {
    this.program = new Command();
    this.commands = new Commands();
    this.serverCommand = new ServerCommand();
    this.setupCommands();
  }

  /**
   * Setup CLI commands
   */
  setupCommands() {
    this.program
      .name('dlest')
      .description('Jest for your data layer - test runner for analytics tracking')
      .version(this.getVersion());

    // Main run command (default)
    this.program
      .argument('[files...]', 'Test files to run')
      .option('--config <path>', 'Path to config file')
      .option('--browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
      .option('--headless', 'Run in headless mode', true)
      .option('--no-headless', 'Run in headed mode')
      .option('--timeout <ms>', 'Test timeout in milliseconds', '30000')
      .option('--verbose', 'Verbose output')
      .option('--watch', 'Watch mode (not implemented yet)')
      .option('--serve', 'Auto-start development server before tests')
      .option('--serve-port <port>', 'Port for development server', '3000')
      .option('--serve-root <path>', 'Root directory for development server')
      .action(async (files, options) => {
        let server = null;
        
        try {
          // Start server if --serve option is provided
          if (options.serve) {
            console.log(chalk.cyan('🚀 Starting development server for tests...\n'));
            
            const serverOptions = {
              port: parseInt(options.servePort) || 3000,
              root: options.serveRoot || process.cwd(),
              verbose: false, // Keep server quiet during tests
            };

            const serverResult = await this.serverCommand.serveForTests(serverOptions);
            server = this.serverCommand;
            
            // Update base URL in test config if not already set
            if (!options.config) {
              options.baseURL = serverResult.url;
            }
          }

          // Run tests
          const result = await this.commands.run({
            testFiles: files,
            browser: options.browser,
            headless: options.headless,
            timeout: parseInt(options.timeout),
            verbose: options.verbose,
            config: options.config,
            baseURL: options.baseURL,
          });
          
          // Stop server if it was started
          if (server) {
            console.log(chalk.gray('\n⏹️  Stopping development server...'));
            await server.stop();
          }
          
          process.exit(result.success ? 0 : 1);
          
        } catch (error) {
          // Ensure server is stopped on error
          if (server) {
            await server.stop();
          }
          
          console.error(chalk.red('❌ Error running tests:'));
          console.error(chalk.red(error.message));
          process.exit(1);
        }
      });

    // Init command
    this.program
      .command('init')
      .description('Initialize DLest in current project')
      .option('--template <type>', 'Template to use (minimal, basic, spa, gtm, ecommerce)', 'basic')
      .option('--force', 'Overwrite existing files')
      .action(async (options) => {
        const result = await this.commands.init(options);
        process.exit(result.success ? 0 : 1);
      });

    // Install command
    this.program
      .command('install')
      .description('Install Playwright browsers')
      .action(async (options) => {
        const result = await this.commands.install(options);
        process.exit(result.success ? 0 : 1);
      });

    // Serve command
    this.program
      .command('serve')
      .description('Start development server')
      .option('-p, --port <port>', 'Port to run server on', '3000')
      .option('-r, --root <path>', 'Root directory to serve', process.cwd())
      .option('-h, --host <host>', 'Host to bind server to', 'localhost')
      .option('-v, --verbose', 'Verbose server logs')
      .action(async (options) => {
        // Validate options
        const errors = ServerCommand.validateOptions(options);
        if (errors.length > 0) {
          console.error(chalk.red('❌ Invalid options:'));
          errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
          process.exit(1);
        }

        // Convert port to number
        if (options.port) {
          options.port = parseInt(options.port, 10);
          if (isNaN(options.port)) {
            console.error(chalk.red('❌ Port must be a number'));
            process.exit(1);
          }
        }

        // Start server and wait
        await this.serverCommand.serveAndWait(options);
      });

    // Version command (handled by commander automatically)
    
    // Help customization
    this.program.on('--help', () => {
      console.log('');
      console.log('Examples:');
      console.log('  $ dlest                           # Run all tests');
      console.log('  $ dlest tests/specific.test.js    # Run specific test');
      console.log('  $ dlest --browser=firefox         # Use Firefox');
      console.log('  $ dlest --no-headless             # Run with GUI');
      console.log('  $ dlest --serve                   # Auto-start server + run tests');
      console.log('  $ dlest serve                     # Start development server');
      console.log('  $ dlest serve --port 8080         # Server on custom port');
      console.log('  $ dlest init                      # Initialize project');
      console.log('  $ dlest init --template=ecommerce # Init with e-commerce template');
      console.log('');
      console.log('Configuration:');
      console.log('  Create dlest.config.js in your project root for custom settings.');
      console.log('');
      console.log('Documentation:');
      console.log('  https://github.com/metricasboss/dlest');
    });
  }

  /**
   * Run CLI
   */
  async run(args = process.argv) {
    try {
      await this.program.parseAsync(args);
    } catch (error) {
      console.error(chalk.red('❌ CLI Error:'));
      console.error(chalk.red(error.message));
      
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }
      
      process.exit(1);
    }
  }

  /**
   * Get version from package.json
   */
  getVersion() {
    try {
      const packagePath = path.join(__dirname, '../../package.json');
      const packageJson = require(packagePath);
      return packageJson.version || '0.1.0';
    } catch (error) {
      return '0.1.0';
    }
  }

  /**
   * Handle uncaught errors
   */
  setupErrorHandlers() {
    process.on('uncaughtException', (error) => {
      console.error(chalk.red('💥 Uncaught Exception:'));
      console.error(chalk.red(error.message));
      console.error(chalk.gray(error.stack));
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error(chalk.red('💥 Unhandled Rejection:'));
      console.error(chalk.red(reason));
      process.exit(1);
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\\n⏹️  Interrupted by user'));
      process.exit(0);
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      console.log(chalk.yellow('\\n⏹️  Terminated'));
      process.exit(0);
    });
  }
}

module.exports = { CLIRunner };