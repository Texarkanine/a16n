/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'CLI',
      items: [
        'cli/index',
        {
          type: 'link',
          label: 'API Reference',
          href: '/docs/cli/api/',
        },
      ],
    },
    {
      type: 'category',
      label: 'Engine',
      items: [
        'engine/index',
        {
          type: 'link',
          label: 'API Reference',
          href: '/docs/engine/api/',
        },
      ],
    },
    {
      type: 'category',
      label: 'Models',
      items: [
        'models/index',
        {
          type: 'link',
          label: 'API Reference',
          href: '/docs/models/api/',
        },
      ],
    },
    {
      type: 'category',
      label: 'Plugin: Cursor',
      items: [
        'plugin-cursor/index',
        {
          type: 'link',
          label: 'API Reference',
          href: '/docs/plugin-cursor/api/',
        },
      ],
    },
    {
      type: 'category',
      label: 'Plugin: Claude',
      items: [
        'plugin-claude/index',
        {
          type: 'link',
          label: 'API Reference',
          href: '/docs/plugin-claude/api/',
        },
      ],
    },
    {
      type: 'category',
      label: 'Glob Hook',
      items: [
        'glob-hook/index',
      ],
    },
  ],
};

export default sidebars;
