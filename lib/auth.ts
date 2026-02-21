/**
 * NextAuth config. Required env: NEXTAUTH_SECRET (use `openssl rand -base64 32`).
 * For local dev also set NEXTAUTH_URL=http://localhost:3000 (or your dev port).
 */
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.trim().toLowerCase()
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            memberships: {
              include: {
                org: true,
              },
            },
          },
        })

        if (!user) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          return null
        }

        const fullName =
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.name
        return {
          id: user.id,
          email: user.email,
          name: fullName || user.name,
          memberships: user.memberships.map((m) => ({
            orgId: m.orgId,
            orgSlug: m.org.slug,
            role: m.role,
          })),
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Store minimal payload to avoid 431 Request Header Fields Too Large (cookie size)
        token.m = (user as any).memberships?.map((m: { orgId: string; orgSlug: string; role: string }) => ({
          i: m.orgId,
          s: m.orgSlug,
          r: m.role,
        })) ?? []
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.memberships = (token.m as { i: string; s: string; r: string }[]).map((m) => ({
          orgId: m.i,
          orgSlug: m.s,
          role: m.r === "ADMIN" ? "ADMIN" : "USER",
        }))
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
}
