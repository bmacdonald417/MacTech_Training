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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
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
  },
  session: {
    strategy: "jwt",
  },
}
