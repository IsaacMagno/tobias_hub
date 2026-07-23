import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginChampion } from "@/lib/services/auth";

const nextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Usúario", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const result = await loginChampion(
          String(credentials.username || "").trim().toLowerCase(),
          credentials.password
        );

        if (!result) return null;

        return {
          champion_id: result.champion.champion_id,
          username: result.champion.username,
          accessToken: result.token,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    maxAge: 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.champion = user;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.champion;
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST, nextAuthOptions };
