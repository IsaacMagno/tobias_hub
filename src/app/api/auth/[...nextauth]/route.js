import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { doLogin } from "../../../services/requests";

const nextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Usúario", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const result = await doLogin(
          credentials.username,
          credentials.password
        );

        const user = result;

        if (user) {
          return Promise.resolve(user);
        } else {
          return Promise.resolve(null);
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    jwt: true,
    maxAge: 60 * 60,
    // updateAge: 24 * 60 * 60,
  },
  callbacks: {
    async session(session, user) {
      session.user = user;
      return session;
    },
    async jwt(token, user) {
      if (user) {
        token = user;
      }
      return token;
    },
  },
};

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
