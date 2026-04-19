import type { NextConfig } from 'next'

// Validate environment variables at build/start time.
// If required envs are missing the server will refuse to start.
import './src/lib/env'

// ── HTTP Security Headers ──────────────────────────────────────────────────
// Applied to all routes. Tune CSP per environment as needed.
const securityHeaders = [
  {
    // Prevents MIME type sniffing — browsers must respect declared content-type
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Prevents clickjacking by disallowing framing from other origins
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Forces HTTPS for 1 year, including subdomains
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    // Controls how much referrer info is sent with requests
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Restricts which browser APIs can be used — disable dangerous ones
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    // Content Security Policy — restricts allowed resource origins
    // Adjust 'connect-src' if you add third-party API calls (e.g. analytics)
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js inline scripts + React hydration require 'unsafe-inline' and 'unsafe-eval'
      // In production with a strict CSP you'd use nonces. This is a safe baseline.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Supabase API + storage
      `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''} https://*.supabase.co wss://*.supabase.co`,
      // Images: self + supabase storage
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  experimental: {
    // Use React 19 server action improvements
  },

  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
