// src/config/brandingOverride.ts

// This file allows overriding branding configurations.
// If no override is provided, defaults from `brandingConfig.ts` will be used.

const brandingOverride = {
  // Example overrides:
  companyName: 'CleverThis Inc.',
  deploymentName: 'CleverBrag',
  navbar: {
    appName: 'CleverBrag',
    showDocsButton: false,
    menuItems: {
      home: true,
      documents: true,
      collections: true,
      chat: true,
      search: true,
      users: true,
      logs: true,
      analytics: true,
      settings: true,
    },
  },
  logo: {
    src: 'https://cleverthis.com/images/logo.png',
    alt: 'https://cleverthis.com/images/logo.png',
  },
  theme: 'light',
  auth: {
    loginUrl: 'https://api.cleverbrag-test.cleverthis.com',
  },
  homePage: {
    pythonSdk: false,
    githubCard: false,
    hatchetCard: false,
  },
  nextConfig: {
    additionalRemoteDomain: 'cleverthis.com',
  },
};

// Export the override object
export default brandingOverride;
