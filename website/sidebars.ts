import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/first-test',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/writing-tests',
        'guides/remote-testing',
        'guides/network-validation',
        'guides/cloud-export',
        'guides/templates',
        'guides/debugging',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/ecommerce',
        'examples/forms',
        'examples/spa',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/ga4-validation',
        'advanced/custom-matchers',
        'advanced/ci-cd',
      ],
    },
    {
      type: 'link',
      label: 'Contributing',
      href: 'https://github.com/metricasboss/dlest/blob/main/CONTRIBUTING.md',
    },
  ],

  apiSidebar: [
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: [
        'api/test-api',
        'api/matchers',
        'api/fixtures',
        'api/cli',
        'api/configuration',
      ],
    },
  ],
};

export default sidebars;
