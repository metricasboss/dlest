import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'DLest',
  tagline: 'Jest for your data layer - test runner for analytics tracking',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://metricasboss.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/dlest/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'metricasboss', // Usually your GitHub org/user name.
  projectName: 'dlest', // Usually your repo name.
  deploymentBranch: 'gh-pages', // Branch for deployment
  trailingSlash: false, // GitHub Pages compatibility

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pt-BR'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/', // Docs na raiz do site
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/metricasboss/dlest/tree/main/website/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/metricasboss/dlest/tree/main/website/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/dlest-social-card.png',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'DLest',
      logo: {
        alt: 'DLest Logo',
        src: 'img/logo.svg',
        href: '/getting-started/installation',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API',
        },
        {
          href: 'https://www.npmjs.com/package/dlest',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/metricasboss/dlest',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/getting-started/installation',
            },
            {
              label: 'API Reference',
              to: '/api/matchers',
            },
            {
              label: 'Examples',
              to: '/examples/ecommerce',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/metricasboss/dlest/discussions',
            },
            {
              label: 'Issue Tracker',
              href: 'https://github.com/metricasboss/dlest/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              href: 'https://metricasboss.com.br/blog-de-web-analytics',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/metricasboss/dlest',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/dlest',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} MetricasBoss. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'javascript', 'typescript', 'json'],
    },
  } satisfies Preset.ThemeConfig,

  themes: ['@docusaurus/theme-live-codeblock'],
};

export default config;
