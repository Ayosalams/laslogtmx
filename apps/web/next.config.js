/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['react-native', '@sentry/react-native'],
  outputFileTracingExcludes: {
    '*': [
      'node_modules/react-native/**',
      'node_modules/@sentry/react-native/**',
      '../../node_modules/react-native/**',
      '../../node_modules/@sentry/react-native/**',
      '../../apps/mobile/**',
    ],
  },
};

module.exports = nextConfig;
