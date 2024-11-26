/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
    typedRoutes: true,
    serverComponentsExternalPackages: []
  },
  typescript: {
    ignoreBuildErrors: false
  },
  webpack: (config, { isServer }) => {
    // Add TypeScript loader
    config.module.rules.push({
      test: /\.ts$/,
      use: [
        {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        }
      ]
    });
    return config;
  },
  env: {
    AZURE_SEARCH_ENDPOINT: process.env.AZURE_SEARCH_ENDPOINT,
    AZURE_SEARCH_KEY: process.env.AZURE_SEARCH_KEY,
    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_KEY: process.env.AZURE_OPENAI_KEY,
    AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
    AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    NEO4J_URI: process.env.NEO4J_URI,
    NEO4J_USER: process.env.NEO4J_USER,
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
    LIQUIBASE_CHANGELOG_FILE: process.env.LIQUIBASE_CHANGELOG_FILE,
    LIQUIBASE_URL: process.env.LIQUIBASE_URL,
    LIQUIBASE_USERNAME: process.env.LIQUIBASE_USERNAME,
    LIQUIBASE_PASSWORD: process.env.LIQUIBASE_PASSWORD,
    KEY_VAULT_URL: process.env.KEY_VAULT_URL,
    KEY_VAULT_KEY: process.env.KEY_VAULT_KEY
  }
}

module.exports = nextConfig 