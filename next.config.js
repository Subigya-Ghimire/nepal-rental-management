const { ESLint } = require('eslint')

module.exports = {
  async headers() {
    return []
  },
  async rewrites() {
    return []
  },
  eslint: {
    // Warning: This disables ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This disables type checking during production builds
    ignoreBuildErrors: true,
  },
}