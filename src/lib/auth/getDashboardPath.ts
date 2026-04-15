/**
 * Returns the correct dashboard path for a given user role.
 * Used consistently across auth actions, redirects, and page guards.
 */
export function getDashboardPath(role: string): string {
  if (role === "super_admin") return "/dashboard/super-admin";
  if (role === "admin") return "/dashboard/admin";
  if (role === "profesor") return "/dashboard/teacher";
  return "/dashboard/student";
}
