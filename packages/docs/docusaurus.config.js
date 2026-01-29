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

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: '.generated',
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/your-org/a16n/tree/main/apps/docs/',
          async sidebarItemsGenerator({defaultSidebarItemsGenerator, ...args}) {
            const sidebarItems = await defaultSidebarItemsGenerator(args);
            
            // Recursively sort version folders descending (0.4.0 > 0.3.0 > 0.2.0)
            const sortItems = (items) => {
              return items.map(item => {
                if (item.type === 'category' && item.items) {
                  // Recursively sort children first
                  item.items = sortItems(item.items);
                  
                  // If this category contains version folders, sort them descending
                  // Match both "0.3.0" and "0.3.0 (latest)" formats
                  const hasVersions = item.items.some(i => 
                    i.label && /^\d+\.\d+\.\d+/.test(i.label)
                  );
                  
                  if (hasVersions) {
                    item.items.sort((a, b) => {
                      // Extract version numbers (ignore any suffix like " (latest)")
                      const aMatch = a.label?.match(/^(\d+)\.(\d+)\.(\d+)/);
                      const bMatch = b.label?.match(/^(\d+)\.(\d+)\.(\d+)/);
                      
                      // Non-versions sort to end
                      if (!aMatch && !bMatch) return 0;
                      if (!aMatch) return 1;
                      if (!bMatch) return -1;
                      
                      // Compare versions (descending: latest first)
                      const aMajor = parseInt(aMatch[1], 10);
                      const bMajor = parseInt(bMatch[1], 10);
                      if (aMajor !== bMajor) return bMajor - aMajor;
                      
                      const aMinor = parseInt(aMatch[2], 10);
                      const bMinor = parseInt(bMatch[2], 10);
                      if (aMinor !== bMinor) return bMinor - aMinor;
                      
                      const aPatch = parseInt(aMatch[3], 10);
                      const bPatch = parseInt(bMatch[3], 10);
                      return bPatch - aPatch;
                    });
                  }
                }
                return item;
              });
            };
            
            return sortItems(sidebarItems);
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [],

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
        logo: {
          alt: 'a16n Logo',
          src: 'img/logo.svg',
        },
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
                to: '/intro',
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
