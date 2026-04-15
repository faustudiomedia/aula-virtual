import { expect, test } from "vitest";

test("Env validation fails when variables are missing", async () => {
  // Store original env
  const originalEnv = process.env;

  // Clear required env vars
  process.env = { ...originalEnv };
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // We have to isolate the module import to test top-level throw
  await expect(async () => {
    // Dynamic import to avoid caching issues during tests
    await import("@/lib/env");
  }).rejects.toThrow();

  // Restore env
  process.env = originalEnv;
});
