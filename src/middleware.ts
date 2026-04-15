// Re-export the proxy function as the Next.js middleware entry point.
// The proxy handles: session refresh, unauthenticated redirects,
// role-based path guards, and multi-institute branding headers.
export { proxy as default, config } from "./proxy";
