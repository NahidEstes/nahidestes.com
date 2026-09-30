import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { rateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login" },
  providers: [CredentialsProvider({
    name: "Administrator",
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials, request) {
      const email = credentials?.email?.trim().toLowerCase();
      const password = credentials?.password;
      const ip = request.headers?.["x-forwarded-for"] || "local";
      if (!rateLimit(`login:${ip}:${email}`, 5, 15 * 60_000) || !email || !password || !await connectDB()) return null;
      const user = await User.findOne({ email }).select("+passwordHash");
      if (!user || !await bcrypt.compare(password, user.passwordHash)) return null;
      return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
    },
  })],
  callbacks: {
    async jwt({ token, user }) { if (user) token.role = (user as { role?: string }).role; return token; },
    async session({ session, token }) { if (session.user) { session.user.id = token.sub || ""; session.user.role = String(token.role || "admin"); } return session; },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};
