import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  async function getClaimsSafely() {
    try {
      const { data } = await supabase.auth.getClaims()
      return data?.claims
    } catch {
      return undefined
    }
  }
  const user = await getClaimsSafely()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname === '/login') {
    // Already signed in — don't let them re-enter /login. Bounce back to
    // wherever they came from (same-origin referer) so the button/bookmark
    // just feels like a no-op, falling back to /kudos when there's no
    // usable referer (direct URL entry, cross-origin link, etc).
    const referer = request.headers.get('referer')
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        if (
          refererUrl.origin === request.nextUrl.origin &&
          refererUrl.pathname !== '/login' &&
          !refererUrl.pathname.startsWith('/auth')
        ) {
          return NextResponse.redirect(refererUrl)
        }
      } catch {
        // malformed referer header — fall through to the default redirect
      }
    }
    const url = request.nextUrl.clone()
    url.pathname = '/kudos'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
