import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Jest-like API',
    emoji: '🧪',
    description: (
      <>
        Familiar syntax for JavaScript developers. If you know Jest, you already know DLest.
        Write tests with <code>test()</code>, <code>expect()</code>, and <code>describe()</code>.
      </>
    ),
  },
  {
    title: 'Purpose-built for Analytics',
    emoji: '🎯',
    description: (
      <>
        Custom matchers designed specifically for testing data layer events.
        Check events, validate data, verify sequences - all with simple assertions.
      </>
    ),
  },
  {
    title: 'Fast & Reliable',
    emoji: '🚀',
    description: (
      <>
        Built on Playwright for real browser testing. Run tests in Chromium, Firefox, or WebKit.
        Fast execution with reliable event capture.
      </>
    ),
  },
  {
    title: 'Remote Testing',
    emoji: '🌐',
    description: (
      <>
        Test staging and production environments directly. No need to run sites locally.
        Includes authentication support for protected environments.
      </>
    ),
  },
  {
    title: 'GA4 Validation',
    emoji: '🔍',
    description: (
      <>
        Built-in Google Analytics 4 network validation. Catch naming issues, parameter limits,
        and implementation errors before they reach production.
      </>
    ),
  },
  {
    title: 'Zero Config',
    emoji: '📦',
    description: (
      <>
        Works out of the box with sensible defaults. Optional configuration for advanced use cases.
        Includes built-in server - no Python or external tools needed.
      </>
    ),
  },
];

function Feature({title, emoji, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center" style={{fontSize: '4rem', marginBottom: '1rem'}}>
        {emoji}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
