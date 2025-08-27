import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingExcludes: {
    '*': ['./frontend/**/*'],
  },
}

export default nextConfig
