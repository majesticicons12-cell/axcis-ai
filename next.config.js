/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@img/sharp-libvips-linuxmusl-x64/**',
      'node_modules/@img/sharp-libvips-linux-x64/**',
    ],
  },
};

module.exports = nextConfig;
