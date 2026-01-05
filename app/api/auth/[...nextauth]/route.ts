import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        // Extract first and last name from Google profile
        // Note: This uses a simple split which works for most Western names
        // but may not handle all naming conventions (e.g., single names, compound names)
        const nameParts = session.user.name?.split(" ") || []
        session.user.id = token.sub || ""
        session.user.firstName = nameParts[0] || ""
        session.user.lastName = nameParts.slice(1).join(" ") || ""
      }
      return session
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = account.providerAccountId
      }
      return token
    },
  },
  pages: {
    signIn: "/",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
