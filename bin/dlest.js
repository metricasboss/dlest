#!/usr/bin/env node

/**
 * DLest CLI Entry Point
 * 
 * Executable entry point for DLest command line interface
 */

const { CLIRunner } = require('../src/cli/runner');

async function main() {
  const cli = new CLIRunner();
  
  // Setup error handlers for graceful shutdown
  cli.setupErrorHandlers();
  
  // Run the CLI
  await cli.run();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}