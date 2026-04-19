import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Early return for asset paths (no DB queries needed) ──────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // ── Supabase session refresh (required on every request) ─────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── Redirect unauthenticated users ────────────────────────────────────────
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Redirect authenticated users away from login ──────────────────────────
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── Profile & institute branding (only for dashboard routes) ─────────────
  // Fetch profile+institute in a single join to reduce round-trips
  if (user && pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, institutes(name, primary_color, secondary_color, logo_url)')
      .eq('id', user.id)
      .single()

    if (profile) {
      const role = profile.role as string

      // Role-based path guard
      if (role === 'alumno' && (pathname.startsWith('/dashboard/teacher') || pathname.startsWith('/dashboard/admin'))) {
        return NextResponse.redirect(new URL('/dashboard/student', request.url))
      }
      if (role === 'profesor' && pathname.startsWith('/dashboard/admin')) {
        return NextResponse.redirect(new URL('/dashboard/teacher', request.url))
      }

      // Inject per-institute branding into response headers
      const inst = (profile.institutes as unknown) as { name: string; primary_color: string; secondary_color: string; logo_url?: string } | null
      if (inst) {
        response.headers.set('x-institute-name', inst.name)
        response.headers.set('x-institute-primary', inst.primary_color)
        response.headers.set('x-institute-secondary', inst.secondary_color)
        if (inst.logo_url) {
          response.headers.set('x-institute-logo', inst.logo_url)
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
