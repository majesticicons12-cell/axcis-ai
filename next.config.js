/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  outputFileTracingExcludes: {
    '*': [
      'node_modules/onnxruntime-node/**',
      'node_modules/@huggingface/transformers/**',
      'node_modules/@img/sharp-libvips-linuxmusl-x64/**',
      'node_modules/@img/sharp-libvips-linux-x64/**',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'onnxruntime-node': 'commonjs onnxruntime-node',
        '@huggingface/transformers': 'commonjs @huggingface/transformers',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
