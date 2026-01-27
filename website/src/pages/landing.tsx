import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';

import styles from './landing.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/getting-started/installation">
            Get Started
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/examples/ecommerce"
            style={{marginLeft: '10px'}}>
            View Examples
          </Link>
        </div>
        <div style={{marginTop: '40px'}}>
          <CodeBlock language="bash">
            npm install --save-dev dlest
          </CodeBlock>
        </div>
      </div>
    </header>
  );
}

function HomepageExample() {
  const exampleCode = `const { test, expect } = require('dlest');

test('purchase flow tracking', async ({ page, dataLayer }) => {
  // Navigate to product page
  await page.goto('http://localhost:3000/product/123');

  // Click add to cart
  await page.click('#add-to-cart');

  // Complete checkout
  await page.click('#checkout');

  // Verify events
  await expect(dataLayer).toHaveEvent('purchase', {
    transaction_id: expect.any(String),
    value: 99.99,
    currency: 'USD'
  });

  // Verify sequence
  await expect(dataLayer).toHaveEventSequence([
    'view_item',
    'add_to_cart',
    'purchase'
  ]);
});`;

  return (
    <section className={styles.exampleSection}>
      <div className="container">
        <Heading as="h2" style={{textAlign: 'center', marginBottom: '40px'}}>
          Write Tests Like You Write Code
        </Heading>
        <div className="row">
          <div className="col">
            <CodeBlock language="javascript" title="tests/purchase.test.js">
              {exampleCode}
            </CodeBlock>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyDLest() {
  return (
    <section className={styles.whySection}>
      <div className="container">
        <Heading as="h2" style={{textAlign: 'center', marginBottom: '20px'}}>
          Why DLest?
        </Heading>
        <p style={{textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px', fontSize: '1.2rem'}}>
          Analytics tracking breaks constantly. Frontend changes remove tracking elements.
          Refactoring changes event parameters. A/B tests break conversion tracking.
          DLest enables you to catch these bugs before they reach production.
        </p>
        <div className="row">
          <div className="col col--6">
            <h3>❌ Without DLest</h3>
            <ul>
              <li>Manual QA testing</li>
              <li>Bugs discovered in production</li>
              <li>Lost revenue from broken tracking</li>
              <li>Inaccurate data and reports</li>
              <li>No confidence in deployments</li>
            </ul>
          </div>
          <div className="col col--6">
            <h3>✅ With DLest</h3>
            <ul>
              <li>Automated tracking tests</li>
              <li>Bugs caught in CI/CD</li>
              <li>Reliable analytics data</li>
              <li>Accurate business metrics</li>
              <li>Deploy with confidence</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Jest for your data layer"
      description="DLest is a test runner specifically designed for testing analytics tracking implementations. Write tests for your data layer with familiar Jest-like syntax.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <HomepageExample />
        <WhyDLest />
      </main>
    </Layout>
  );
}
