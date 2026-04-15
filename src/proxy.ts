import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ── Supabase session refresh ──────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Redirect unauthenticated users ────────────────────────────────────────
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Redirect authenticated users away from login ──────────────────────────
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Multi-institute branding via request header ───────────────────────────
  // The header is read by the root layout to set CSS custom properties.
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("institute_id, role")
      .eq("id", user.id)
      .single();

    if (profile?.institute_id) {
      const { data: institute } = await supabase
        .from("institutes")
        .select("name, primary_color, secondary_color, logo_url")
        .eq("id", profile.institute_id)
        .single();

      if (institute) {
        response.headers.set("x-institute-name", institute.name);
        response.headers.set("x-institute-primary", institute.primary_color);
        response.headers.set(
          "x-institute-secondary",
          institute.secondary_color,
        );
        if (institute.logo_url) {
          response.headers.set("x-institute-logo", institute.logo_url);
        }
      }
    }

    // Role-based path guard
    if (profile?.role && pathname.startsWith("/dashboard")) {
      const role = profile.role as string;
      if (role === "alumno" && pathname.startsWith("/dashboard/teacher")) {
        return NextResponse.redirect(
          new URL("/dashboard/student", request.url),
        );
      }
      if (role === "alumno" && pathname.startsWith("/dashboard/admin")) {
        return NextResponse.redirect(
          new URL("/dashboard/student", request.url),
        );
      }
      if (role === "profesor" && pathname.startsWith("/dashboard/admin")) {
        return NextResponse.redirect(
          new URL("/dashboard/teacher", request.url),
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
