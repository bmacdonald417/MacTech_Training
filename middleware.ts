import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Public routes
    if (path === "/login") {
      return NextResponse.next()
    }

    // If no token, redirect to login (no callbackUrl to avoid 431 from huge query strings)
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.search = ""
      return NextResponse.redirect(loginUrl)
    }

    // If user has memberships, allow access (token.m = minimal payload from auth)
    const memberships = (token as any).m ?? (token as any).memberships ?? []
    if (memberships.length === 0) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.search = ""
      return NextResponse.redirect(loginUrl)
    }

    // If accessing root, redirect to first org
    if (path === "/") {
      const first = memberships[0]
      const slug = first?.s ?? first?.orgSlug
      if (slug) {
        return NextResponse.redirect(new URL(`/org/${slug}/dashboard`, req.url))
      }
    }

    // Check org route access
    const orgMatch = path.match(/^\/org\/([^/]+)/)
    if (orgMatch) {
      const orgSlug = orgMatch[1]
      const hasAccess = memberships.some((m: any) => (m.s ?? m.orgSlug) === orgSlug)
      if (!hasAccess) {
        const loginUrl = new URL("/login", req.url)
        loginUrl.search = ""
        return NextResponse.redirect(loginUrl)
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  // Do not match /login — so the login page loads without auth and we avoid redirect loops
  matcher: ["/", "/org/:path*"],
}
