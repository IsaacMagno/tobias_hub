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

        const user = result.champion;
        const token = result.token;

        if (user) {
          return Promise.resolve({ ...user, accessToken: token });
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
    maxAge: 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      // console.log("TOKEN: ", token);
      // console.log("USER: ", user);

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
