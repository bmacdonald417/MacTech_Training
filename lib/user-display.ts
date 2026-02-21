/**
 * Helpers for user display name and computer-generated user ID.
 * Used on certificates and anywhere we need full name or unique display ID.
 */

export type UserLike = {
  name?: string | null
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  displayId?: string | null
}

/** Full name: "FirstName LastName", or legacy name, or email, or "User". */
export function getFullName(user: UserLike | null | undefined): string {
  if (!user) return "User"
  const first = (user.firstName ?? "").trim()
  const last = (user.lastName ?? "").trim()
  if (first || last) return [first, last].filter(Boolean).join(" ")
  return (user.name ?? user.email ?? "User").trim() || "User"
}

/** Computer-generated user ID for certificates (avoids same-name collisions). */
export function getDisplayId(user: UserLike | null | undefined): string | null {
  if (!user) return null
  return user.displayId?.trim() || null
}
