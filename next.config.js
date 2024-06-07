module.exports = {
  reactStrictMode: false,
  images: {
    domains: ['github.com', 'lh3.googleusercontent.com'],
  },
  env: {
    CLOUD_INKEEP_API_KEY: process.env.CLOUD_INKEEP_API_KEY,
    CLOUD_INKEEP_INT_ID: process.env.CLOUD_INKEEP_INT_ID,
    CLOUD_INKEEP_ORG_ID: process.env.CLOUD_INKEEP_ORG_ID,
    CLOUD_DOCS_INKEEP_API_KEY: process.env.CLOUD_DOCS_INKEEP_API_KEY,
    CLOUD_DOCS_INKEEP_INT_ID: process.env.CLOUD_DOCS_INKEEP_INT_ID,
    CLOUD_DOCS_INKEEP_ORG_ID: process.env.CLOUD_DOCS_INKEEP_ORG_ID,
  },
};
