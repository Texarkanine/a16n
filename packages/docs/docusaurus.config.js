// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'a16n Documentation',
  tagline: 'AI agent configuration translation toolkit',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'your-org', // Usually your GitHub org/user name.
  projectName: 'a16n', // Usually your repo name.

  onBrokenLinks: 'warn',
  markdown: {
    mermaid: true,
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Enable faster experimental features
  // Docs: https://docusaurus.io/docs/api/docusaurus-config#future
  // Expected: 2-4x faster builds using Rust-based tooling (SWC, Lightning CSS)
  future: {
    experimental_faster: {
      swcJsLoader: true,
      swcJsMinimizer: true,
      swcHtmlMinimizer: true,
      lightningCssMinimizer: true,
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: '.generated',
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl:
            'https://github.com/Texarkanine/a16n/tree/main/packages/docs/docs/',
          async sidebarItemsGenerator({defaultSidebarItemsGenerator, ...args}) {
            const sidebarItems = await defaultSidebarItemsGenerator(args);
            
            // Sort version folders newest-first (0.4.0 -> 0.3.0 -> 0.2.0)
            // Applied to EVERY level including top-level items
            function sortVersions(items) {
              // First, recursively sort children
              items.forEach(item => {
                if (item.type === 'category' && item.items) {
                  sortVersions(item.items);
                }
              });
              
              // Then sort THIS level (this was the missing piece!)
              items.sort((a, b) => {
                const aLabel = a.label || '';
                const bLabel = b.label || '';
                const aMatch = aLabel.match(/^(\d+)\.(\d+)\.(\d+)/);
                const bMatch = bLabel.match(/^(\d+)\.(\d+)\.(\d+)/);
                
                // Non-version items: preserve order
                if (!aMatch && !bMatch) return 0;
                if (!aMatch) return 1;
                if (!bMatch) return -1;
                
                // Both are versions: sort descending (newest first)
                const [, aMaj, aMin, aPat] = aMatch.map(Number);
                const [, bMaj, bMin, bPat] = bMatch.map(Number);
                return (bMaj - aMaj) || (bMin - aMin) || (bPat - aPat);
              });
              
              return items;
            }
            
            return sortVersions(sidebarItems);
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    // Custom plugin to optimize webpack configuration
    // Docs: https://docusaurus.io/docs/api/plugin-methods/lifecycle-apis#configureWebpack
    function webpackOptimizationPlugin(context, options) {
      return {
        name: 'webpack-optimization-plugin',
        configureWebpack(config, isServer) {
          return {
            cache: {
              type: 'filesystem',
              buildDependencies: {
                config: [__filename],
              },
            },
            // Disable source maps in production (not needed for docs site)
            devtool: process.env.NODE_ENV === 'production' ? false : config.devtool,
          };
        },
      };
    },
  ],

  themes: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        docsRouteBasePath: '/',
        indexBlog: false,
        // Only index latest API version - old versions are browsable but not searchable
        ignoreFiles: [/\/api\/\d+\.\d+\.\d+\//],
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'a16n',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            href: 'https://github.com/your-org/a16n',
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
                label: 'Documentation',
                to: '/',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/your-org/a16n',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} a16n. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
