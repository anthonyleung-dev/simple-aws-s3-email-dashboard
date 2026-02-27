import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // Mark server-only packages as external to avoid bundling issues
    serverExternalPackages: ['mailparser', 'jsdom', 'dompurify'],
}

export default nextConfig
