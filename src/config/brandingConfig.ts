// src/config/brandingConfig.ts

import brandingOverride from './brandingOverride';

// Define default branding configuration
const defaultConfig = {
  companyName: 'EmergentAGI Inc.',
  deploymentName: 'R2R',
  socialLinks: {
    twitter: { enabled: true, url: 'https://twitter.com/ocolegro?lang=en' },
    github: { enabled: true, url: 'https://github.com/SciPhi-AI/R2R' },
    discord: { enabled: true, url: 'https://discord.gg/p6KqD2kjtB' },
  },
  navbar: {
    appName: 'SciPhi',
    showDocsButton: true,
    menuItems: {
      home: true,
      documents: true,
      collections: true,
      chat: true,
      search: true,
      users: true,
      logs: true,
      analytics: false,
      settings: true,
    },
  },
  logo: {
    src: '/images/sciphi.svg',
    alt: 'sciphi.svg',
  },
  theme: 'dark',
  homePage: {
    pythonSdk: true,
    githubCard: true,
    hatchetCard: true,
  },
  nextConfig: {
    additionalRemoteDomain: '',
  },
};

// ✅ Declare `window.__BRANDING_CONFIG__` globally to avoid TypeScript errors
declare global {
  interface Window {
    __BRANDING_CONFIG__?: Partial<typeof defaultConfig>;
  }
}

// ✅ Load user-defined config from `window.__BRANDING_CONFIG__` (if available)
const userConfig =
  (typeof window !== 'undefined' && window.__BRANDING_CONFIG__) || {};

// ✅ Merge `defaultConfig`, `brandingOverride.ts`, and `userConfig`
export const brandingConfig = {
  ...defaultConfig,
  ...brandingOverride,
  ...userConfig,
};
