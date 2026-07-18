import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getSupabase } from "@/lib/supabase";
import { compare } from "bcryptjs";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
  },
  providers: [
    Credentials({
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const phone = credentials?.phone as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!phone || !password) return null;

        const { allowed } = checkRateLimit(`login:${phone}`, 5, 60000);
        if (!allowed) return null;

        const { data: user } = await getSupabase()
          .from("User")
          .select("*")
          .eq("phone", phone)
          .single();

        if (!user) return null;

        const valid = await compare(password, user.password);
        if (!valid) return null;

        resetRateLimit(`login:${phone}`);

        return {
          id: String(user.id),
          name: user.name,
          phone: user.phone,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as unknown as { phone: string }).phone;
        token.role = (user as unknown as { role: string }).role;
      } else if (token.id) {
        const { data } = await getSupabase()
          .from("User")
          .select("name, phone, role")
          .eq("id", Number(token.id))
          .single();
        if (data) {
          token.name = data.name;
          token.phone = data.phone;
          token.role = data.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as { phone: string }).phone = token.phone as string;
        (session.user as unknown as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
});
