const fs = require('fs');
const path = require('path');
const { ConfigLoader } = require('../config/loader');
const { TestRunner } = require('../core/test-runner');
const chalk = require('chalk');

/**
 * CLI Commands
 * 
 * Command implementations for DLest CLI
 */

class Commands {
  constructor() {
    this.configLoader = new ConfigLoader();
  }

  /**
   * Run tests command
   */
  async run(options = {}) {
    try {
      console.log(chalk.cyan('🚀 Starting DLest...\n'));

      // Load configuration
      const config = this.configLoader.load(options);

      if (options.verbose) {
        console.log(chalk.gray('Configuration:'));
        console.log(chalk.gray(JSON.stringify(config, null, 2)));
        console.log('');
      }

      // Get test files
      const testFiles = this.configLoader.getTestFiles(config, options.testFiles || []);
      
      if (testFiles.length === 0) {
        console.log(chalk.yellow('⚠️  No test files found'));
        console.log(chalk.gray(`Looked in: ${config.testDir}`));
        console.log(chalk.gray(`Patterns: ${config.testMatch.join(', ')}`));
        console.log(chalk.gray('\\n💡 Tip: Run `npx dlest init` to create example tests'));
        return { success: false, stats: null };
      }

      console.log(chalk.gray(`Found ${testFiles.length} test file(s):`));
      testFiles.forEach(file => {
        console.log(chalk.gray(`  - ${path.relative(process.cwd(), file)}`));
      });

      // Run tests
      const testRunner = new TestRunner(config);
      const stats = await testRunner.runTests(testFiles);

      // Return results
      const success = stats.failed === 0;
      return { success, stats };

    } catch (error) {
      console.error(chalk.red('❌ Error running tests:'));
      console.error(chalk.red(error.message));
      
      if (options.verbose && error.stack) {
        console.error(chalk.gray(error.stack));
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize project with example tests
   */
  async init(options = {}) {
    try {
      console.log(chalk.cyan('🔧 Initializing DLest project...\n'));

      const template = options.template || 'basic';
      const force = options.force || false;
      const withFixtures = options.withFixtures || ['ecommerce', 'static'].includes(template);
      const baseDir = process.cwd();

      // Create directory structure - fixtures apenas quando solicitado
      const dirs = {
        tests: path.join(baseDir, 'tests'),
        testsE2e: path.join(baseDir, 'tests', 'e2e'),
      };

      // Adicionar fixtures apenas quando necessário
      if (withFixtures) {
        dirs.fixtures = path.join(baseDir, 'fixtures');
        dirs.fixturesAssets = path.join(baseDir, 'fixtures', 'assets');
      }

      // Create all directories
      for (const [name, dirPath] of Object.entries(dirs)) {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(chalk.green(`✓ Created ${name} directory: ${path.relative(baseDir, dirPath)}`));
        }
      }

      // Create config file if it doesn't exist
      try {
        const configPath = this.configLoader.createExampleConfig();
        console.log(chalk.green(`✓ Created config file: dlest.config.js`));
      } catch (error) {
        if (!force) {
          console.log(chalk.yellow(`⚠️  Config file already exists, skipping...`));
        }
      }

      // Handle .gitignore intelligently
      const gitignoreResult = this.updateGitignore(baseDir, force);
      switch (gitignoreResult) {
        case 'created':
          console.log(chalk.green(`✓ Created .gitignore`));
          break;
        case 'updated':
          console.log(chalk.green(`✓ Updated .gitignore (added DLest entries)`));
          break;
        case 'exists':
          console.log(chalk.gray(`ℹ .gitignore already contains DLest entries`));
          break;
      }

      // Create example test file
      const testFilePath = path.join(dirs.tests, 'example.test.js');
      
      if (!fs.existsSync(testFilePath) || force) {
        const testContent = this.getTestTemplate(template, withFixtures);
        fs.writeFileSync(testFilePath, testContent, 'utf8');
        console.log(chalk.green(`✓ Created example test: tests/example.test.js`));
      } else {
        console.log(chalk.yellow(`⚠️  Example test already exists, skipping...`));
      }

      // Create HTML fixtures apenas se withFixtures for true
      if (withFixtures) {
        const htmlFiles = this.getHTMLFixtures(template);
        
        for (const [filename, content] of Object.entries(htmlFiles)) {
          const htmlPath = path.join(dirs.fixtures, filename);
          if (!fs.existsSync(htmlPath) || force) {
            fs.writeFileSync(htmlPath, content, 'utf8');
            console.log(chalk.green(`✓ Created fixture: fixtures/${filename}`));
          }
        }
      }

      // Create .gitkeep files in empty directories
      const gitkeepDirs = [dirs.testsE2e];
      if (withFixtures && dirs.fixturesAssets) {
        gitkeepDirs.push(dirs.fixturesAssets);
      }
      
      for (const dir of gitkeepDirs) {
        const gitkeepPath = path.join(dir, '.gitkeep');
        if (!fs.existsSync(gitkeepPath)) {
          fs.writeFileSync(gitkeepPath, '', 'utf8');
        }
      }

      // Display project structure baseada no que foi criado
      console.log(chalk.cyan('\n📁 Project structure:'));
      console.log(chalk.gray('  tests/'));
      console.log(chalk.gray('    ├── example.test.js'));
      console.log(chalk.gray('    └── e2e/'));
      
      if (withFixtures) {
        console.log(chalk.gray('  fixtures/'));
        console.log(chalk.gray('    ├── test-page.html'));
        if (template === 'ecommerce') {
          console.log(chalk.gray('    ├── products.html'));
        }
        console.log(chalk.gray('    └── assets/'));
      }
      
      console.log(chalk.gray('  dlest.config.js'));
      console.log(chalk.gray('  .gitignore'));

      console.log(chalk.cyan('\n🎉 DLest initialized successfully!'));
      console.log(chalk.gray('\nNext steps:'));
      
      if (withFixtures) {
        console.log(chalk.gray('  1. Start dev server: npx dlest serve'));
        console.log(chalk.gray('  2. Run tests: npx dlest'));
      } else {
        console.log(chalk.gray('  1. Make sure your app is running (e.g., npm run dev)'));
        console.log(chalk.gray('  2. Update baseURL in dlest.config.js if needed'));
        console.log(chalk.gray('  3. Run tests: npx dlest'));
      }
      
      console.log(chalk.gray('\nLearn more: https://github.com/metricasboss/dlest'));

      return { success: true };

    } catch (error) {
      console.error(chalk.red('❌ Error initializing project:'));
      console.error(chalk.red(error.message));
      return { success: false, error: error.message };
    }
  }

  /**
   * Install Playwright browsers
   */
  async install(options = {}) {
    const { exec } = require('child_process');
    
    console.log(chalk.cyan('📦 Installing Playwright browsers...\n'));
    
    return new Promise((resolve) => {
      const command = 'npx playwright install';
      const child = exec(command);
      
      child.stdout?.on('data', (data) => {
        process.stdout.write(data);
      });
      
      child.stderr?.on('data', (data) => {
        process.stderr.write(data);
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('\\n✓ Playwright browsers installed successfully!'));
          resolve({ success: true });
        } else {
          console.log(chalk.red('\\n❌ Failed to install Playwright browsers'));
          resolve({ success: false });
        }
      });
    });
  }

  /**
   * Get .gitignore template
   */
  getGitignoreTemplate() {
    return `# DLest
node_modules/
.dlest-cache/
coverage/
*.log
.DS_Store
.env
.env.local

# Test artifacts
test-results/
playwright-report/
playwright/.cache/

# IDE
.vscode/
.idea/
*.swp
*.swo`;
  }

  /**
   * Update .gitignore intelligently
   */
  updateGitignore(baseDir, force = false) {
    const gitignorePath = path.join(baseDir, '.gitignore');
    const dlestEntries = [
      '# DLest',
      '.dlest-cache/',
      'test-results/',
      'playwright-report/',
      'playwright/.cache/'
    ];

    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      
      // Verificar quais entradas estão faltando
      const missingEntries = dlestEntries.filter(entry => {
        // Para # DLest, verifica se já tem alguma seção DLest
        if (entry === '# DLest') {
          return !content.includes('# DLest') && !content.includes('.dlest-cache');
        }
        return !content.includes(entry.replace(/\/$/, '')); // Remove trailing slash for check
      });
      
      if (missingEntries.length > 0) {
        const newContent = '\n\n' + missingEntries.join('\n');
        fs.appendFileSync(gitignorePath, newContent);
        return 'updated';
      }
      
      return 'exists';
    } else {
      // Criar novo .gitignore completo
      const fullTemplate = this.getGitignoreTemplate();
      fs.writeFileSync(gitignorePath, fullTemplate);
      return 'created';
    }
  }

  /**
   * Get HTML fixtures based on template
   */
  getHTMLFixtures(template) {
    const fixtures = {
      'test-page.html': this.getHTMLTemplate(),
    };

    if (template === 'ecommerce') {
      fixtures['products.html'] = this.getEcommerceHTMLTemplate();
    }

    return fixtures;
  }

  /**
   * Get test template based on type
   */
  getTestTemplate(template, withFixtures = false) {
    // Se não tem fixtures, usar templates para aplicações reais
    if (!withFixtures && template === 'basic') {
      return this.getRealAppTestTemplate();
    }
    
    const templates = {
      minimal: `const { test, expect } = require('dlest');

test('dataLayer exists', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000/test-page.html');
  
  // Simply verify that page loads and dataLayer is accessible
  const events = await dataLayer.getEvents();
  expect(events).toBeDefined();
});
`,

      basic: `const { test, expect } = require('dlest');

test('page view tracking', async ({ page, dataLayer }) => {
  // Navigate to test page
  await page.goto('http://localhost:3000/test-page.html');
  
  // Check that page view event was fired
  expect(dataLayer).toHaveEvent('page_view');
});

test('button click tracking', async ({ page, dataLayer }) => {
  await page.goto('http://localhost:3000/test-page.html');
  
  // Click the tracked button
  await page.click('#tracked-button');
  
  // Verify click event
  expect(dataLayer).toHaveEvent('button_click', {
    button_name: 'test-button'
  });
});
`,

      spa: `const { test, expect } = require('dlest');

test.describe('SPA Navigation Tracking', () => {
  test('initial page view', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/test-page.html');
    
    expect(dataLayer).toHaveEvent('page_view', {
      page_location: expect.any(String),
      page_title: expect.any(String)
    });
  });
  
  test('route change tracking', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/test-page.html');
    
    // Clear initial events
    await dataLayer.clearEvents();
    
    // Simulate route change
    await page.click('[data-route="/about"]');
    
    // Wait for route change event
    await page.waitForTimeout(500);
    
    expect(dataLayer).toHaveEvent('page_view', {
      page_location: expect.stringContaining('/about'),
      page_referrer: expect.any(String)
    });
  });
  
  test('virtual pageview count', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/test-page.html');
    
    // Navigate through multiple routes
    await page.click('[data-route="/products"]');
    await page.click('[data-route="/contact"]');
    
    // Should have 3 page views (initial + 2 route changes)
    expect(dataLayer).toHaveEventCount('page_view', 3);
  });
});
`,

      gtm: `const { test, expect } = require('dlest');

test.describe('Google Tag Manager Events', () => {
  test('GTM loaded', async ({ page }) => {
    await page.goto('http://localhost:3000/test-page.html');
    
    // Verify GTM is loaded
    const gtmLoaded = await page.evaluate(() => {
      return typeof window.google_tag_manager !== 'undefined';
    });
    
    expect(gtmLoaded).toBe(true);
  });
  
  test('custom GTM event', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/test-page.html');
    
    // Trigger custom event
    await page.click('#custom-event-trigger');
    
    expect(dataLayer).toHaveEvent('custom_event', {
      event_category: 'engagement',
      event_label: expect.any(String),
      value: expect.any(Number)
    });
  });
  
  test('enhanced ecommerce via GTM', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/test-page.html');
    
    // GTM often uses 'event' as the key
    expect(dataLayer).toHaveEventData({
      event: 'ecommerce.purchase',
      ecommerce: {
        purchase: {
          actionField: expect.objectContaining({
            id: expect.any(String),
            revenue: expect.any(Number)
          }),
          products: expect.any(Array)
        }
      }
    });
  });
});
`,

      ecommerce: `const { test, expect } = require('dlest');

test.describe('E-commerce Tracking', () => {
  test('product view tracking', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/test-page.html');
    
    expect(dataLayer).toHaveEvent('view_item', {
      currency: expect.any(String),
      value: expect.any(Number),
      items: expect.arrayContaining([
        expect.objectContaining({
          item_id: expect.any(String),
          item_name: expect.any(String)
        })
      ])
    });
  });
  
  test('add to cart tracking', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/test-page.html');
    await page.click('#add-to-cart');
    
    expect(dataLayer).toHaveEvent('add_to_cart', {
      currency: 'USD',
      value: 99.99,
      items: [{
        item_id: 'test-product',
        item_name: 'Test Product',
        quantity: 1
      }]
    });
  });
  
  test('purchase flow', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000/test-page.html');
    await page.click('#add-to-cart');
    await page.click('#checkout');
    
    expect(dataLayer).toHaveEventSequence([
      'view_item',
      'add_to_cart', 
      'purchase'
    ]);
  });
});
`
    };

    return templates[template] || templates.basic;
  }

  /**
   * Get test template for real applications (without fixtures)
   */
  getRealAppTestTemplate() {
    return `// Para o DLest, test, expect e describe são disponibilizados globalmente
test.describe('App Analytics', () => {
  test('page view tracking', async ({ page, dataLayer }) => {
    // Navegar para sua aplicação (ajuste a URL conforme necessário)
    await page.goto('http://localhost:3000');
    
    // Verificar se o evento de visualização de página foi disparado
    expect(dataLayer).toHaveEvent('page_view');
  });

  test('basic interaction tracking', async ({ page, dataLayer }) => {
    await page.goto('http://localhost:3000');
    
    // Exemplo: interação que deve disparar um evento
    // Descomente e ajuste conforme sua aplicação:
    
    // await page.click('#my-button');
    // expect(dataLayer).toHaveEvent('button_click');
    
    // await page.fill('#search-input', 'test');
    // expect(dataLayer).toHaveEvent('search', {
    //   search_term: 'test'
    // });
    
    // Para este exemplo, apenas verificamos que não há erros
    const events = await dataLayer.getEvents();
    expect(events).toBeDefined();
  });
});`;
  }

  /**
   * Get e-commerce HTML template
   */
  getEcommerceHTMLTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DLest E-commerce Test Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; }
        .product { border: 1px solid #ddd; padding: 1rem; margin: 1rem 0; }
        button { padding: 0.5rem 1rem; margin: 0.5rem; cursor: pointer; }
        .cart { background: #f0f0f0; padding: 1rem; margin-top: 2rem; }
    </style>
</head>
<body>
    <h1>E-commerce Test Page</h1>
    
    <div class="product" data-product-id="prod-123">
        <h2>Test Product</h2>
        <p>Price: $99.99</p>
        <button id="add-to-cart">Add to Cart</button>
        <button id="add-to-wishlist">Add to Wishlist</button>
    </div>
    
    <div class="cart">
        <h3>Shopping Cart</h3>
        <div id="cart-items">Empty</div>
        <button id="checkout">Proceed to Checkout</button>
        <button id="clear-cart">Clear Cart</button>
    </div>
    
    <script>
        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        
        // Track product view
        dataLayer.push({
            event: 'view_item',
            currency: 'USD',
            value: 99.99,
            items: [{
                item_id: 'prod-123',
                item_name: 'Test Product',
                category: 'Test Category',
                price: 99.99,
                quantity: 1
            }]
        });
        
        // Add to cart
        document.getElementById('add-to-cart').addEventListener('click', function() {
            dataLayer.push({
                event: 'add_to_cart',
                currency: 'USD',
                value: 99.99,
                items: [{
                    item_id: 'prod-123',
                    item_name: 'Test Product',
                    quantity: 1,
                    price: 99.99
                }]
            });
            
            document.getElementById('cart-items').innerHTML = '1 x Test Product ($99.99)';
        });
        
        // Add to wishlist
        document.getElementById('add-to-wishlist').addEventListener('click', function() {
            dataLayer.push({
                event: 'add_to_wishlist',
                currency: 'USD',
                value: 99.99,
                items: [{
                    item_id: 'prod-123',
                    item_name: 'Test Product'
                }]
            });
        });
        
        // Checkout
        document.getElementById('checkout').addEventListener('click', function() {
            if (document.getElementById('cart-items').innerHTML !== 'Empty') {
                dataLayer.push({
                    event: 'begin_checkout',
                    currency: 'USD',
                    value: 99.99,
                    items: [{
                        item_id: 'prod-123',
                        item_name: 'Test Product',
                        quantity: 1
                    }]
                });
                
                // Simulate purchase after 1 second
                setTimeout(() => {
                    dataLayer.push({
                        event: 'purchase',
                        transaction_id: 'test-' + Date.now(),
                        currency: 'USD',
                        value: 99.99,
                        tax: 8.99,
                        shipping: 5.00,
                        items: [{
                            item_id: 'prod-123',
                            item_name: 'Test Product',
                            quantity: 1,
                            price: 99.99
                        }]
                    });
                    alert('Purchase completed!');
                }, 1000);
            }
        });
        
        // Clear cart
        document.getElementById('clear-cart').addEventListener('click', function() {
            if (document.getElementById('cart-items').innerHTML !== 'Empty') {
                dataLayer.push({
                    event: 'remove_from_cart',
                    currency: 'USD',
                    value: 99.99,
                    items: [{
                        item_id: 'prod-123',
                        item_name: 'Test Product'
                    }]
                });
                document.getElementById('cart-items').innerHTML = 'Empty';
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Get HTML template for testing
   */
  getHTMLTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DLest Test Page</title>
</head>
<body>
    <h1>DLest Test Page</h1>
    <p>This page is used for testing data layer events.</p>
    
    <button id="tracked-button">Click Me (Tracked)</button>
    <button id="add-to-cart">Add to Cart</button>
    <button id="checkout">Checkout</button>
    
    <script>
        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        
        // Fire page view event
        dataLayer.push({
            event: 'page_view',
            page_title: document.title,
            page_location: window.location.href
        });
        
        // Track button clicks
        document.getElementById('tracked-button').addEventListener('click', function() {
            dataLayer.push({
                event: 'button_click',
                button_name: 'test-button',
                timestamp: Date.now()
            });
        });
        
        document.getElementById('add-to-cart').addEventListener('click', function() {
            dataLayer.push({
                event: 'add_to_cart',
                currency: 'USD',
                value: 99.99,
                items: [{
                    item_id: 'test-product',
                    item_name: 'Test Product',
                    quantity: 1
                }]
            });
        });
        
        document.getElementById('checkout').addEventListener('click', function() {
            dataLayer.push({
                event: 'purchase',
                transaction_id: 'test-' + Date.now(),
                currency: 'USD',
                value: 99.99,
                items: [{
                    item_id: 'test-product',
                    item_name: 'Test Product',
                    quantity: 1
                }]
            });
        });
    </script>
</body>
</html>`;
  }
}

module.exports = { Commands };