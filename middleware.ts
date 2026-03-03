import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Public routes (no auth required)
    if (path === "/login" || path === "/signup" || path.startsWith("/join/")) {
      return NextResponse.next()
    }

    // If no token, redirect to login (no callbackUrl to avoid 431 from huge query strings)
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.search = ""
      return NextResponse.redirect(loginUrl)
    }

    // If user has memberships, allow access (token.m = minimal payload from auth)
    const memberships = token.m ?? token.memberships ?? []
    if (memberships.length === 0) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.search = ""
      return NextResponse.redirect(loginUrl)
    }

    const getSlug = (m: (typeof memberships)[number]) => ("s" in m ? m.s : m.orgSlug)

    // If accessing root, redirect to first org
    if (path === "/") {
      const slug = memberships[0] && getSlug(memberships[0])
      if (slug) {
        return NextResponse.redirect(new URL(`/org/${slug}/dashboard`, req.url))
      }
    }

    // Check org route access
    const orgMatch = path.match(/^\/org\/([^/]+)/)
    if (orgMatch) {
      const orgSlug = orgMatch[1]
      const hasAccess = memberships.some((m) => getSlug(m) === orgSlug)
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
      authorized: ({ token, req }) => {
        const path = req.nextUrl?.pathname ?? ""
        if (path === "/login" || path === "/signup" || path.startsWith("/join/")) return true
        return !!token
      },
    },
  }
)

export const config = {
  // Only run auth middleware on protected routes. /login, /signup, /join/* are NOT in matcher so they load without redirect.
  matcher: ["/", "/org/:path*"],
}
