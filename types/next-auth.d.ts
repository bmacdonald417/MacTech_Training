import "next-auth"

/** Minimal membership payload stored in JWT cookie (i=orgId, s=orgSlug, r=role) to avoid 431. */
export type JWTMembershipMinimal = { i: string; s: string; r: string }

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role?: string
      handle?: string | null
      memberships?: Array<{
        orgId: string
        orgSlug: string
        role: string
      }>
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role?: string
    handle?: string | null
    memberships?: Array<{
      orgId: string
      orgSlug: string
      role: string
    }>
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    /** Minimal membership payload to keep cookie size small. */
    m?: JWTMembershipMinimal[]
    /** Legacy; prefer m. */
    memberships?: Array<{ orgId: string; orgSlug: string; role: string }>
  }
}
