import NextAuth, { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

// export const authOptions = {
//   session: {
//     strategy: "jwt", //(1)
//   },
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.accessToken = user.accessToken;
//         token.refreshToken = user.refreshToken;
//       }
//       return token;
//     },
//     async session({ session, token, user }) {
//       session.accessToken = token.accessToken;
//       session.refreshToken = token.refreshToken;
//       return session;
//     },
//   },
//   // pages: {
//   //   signIn: "/login", //(4) custom signin page path
//   // },

//   providers: [
//     Credentials({
//       // The name to display on the sign in form (e.g. "Sign in with...")
//       name: "Credentials",
//       // `credentials` is used to generate a form on the sign in page.
//       // You can specify which fields should be submitted, by adding keys to the `credentials` object.
//       // e.g. domain, username, password, 2FA token, etc.
//       // You can pass any HTML attribute to the <input> tag through the object.
//       credentials: {
//         email: { label: "Email", type: "email", placeholder: "jsmith" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials, req) {
//         // Add logic here to look up the user from the credentials supplied

//         const res = await fetch("http://localhost:8081/auth/login", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             username: credentials?.email,
//             password: credentials?.password,
//           }),
//         });
//         const user = await res.json();

//         if (user) {
//           // Any object returned will be saved in `user` property of the JWT
//           return user;
//         } else {
//           // If you return null then an error will be displayed advising the user to check their details.
//           return null;

//           // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
//         }
//       },
//     }),
//   ],
// };

// const handler = NextAuth(authOptions);
// export {handler as GET, handler as POST};

export const options = {
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        const formData = new FormData();
        formData.append("username", credentials?.email);
        formData.append("password", credentials?.password);
        const params = new URLSearchParams();
        params.grant_type = "password";
        params.client_id = "";
        params.client_secret = "";
        // console.log(
        //   JSON.stringify({
        //     username: credentials?.email,
        //     password: credentials?.password,
        //   })
        // );
        params.append("username", credentials?.username || "");
        params.append("password", credentials?.password || "");

        const res = await fetch("http://localhost:8081/auth/login", {
          method: "POST",
          // formData,
          // params,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: credentials?.email,
            password: credentials?.password,
          }),
        });
        const user = await res.json();

        // console.log("res", user);
        if (user) {
          // Any object returned will be saved in `user` property of the JWT
          return user;
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;

          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        console.log("jwt", token);
      }
      return token;
    },
    async session({ session, token, user }) {
      // session.accessToken = token.accessToken;
      // session.refreshToken = token.refreshToken;
      session.user = {
        ...session.user,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      };
      console.log("session", session);
      return session;
    },
  },
  pages: {
    signIn: "/login",
    // signOut: "/signout",
    error: "/",
    // verifyRequest: "/auth/verify-request",
    // newUser: null, // If set, new users will be directed here on first sign in
  },
};

const handler = NextAuth(options);

export { handler as GET, handler as POST };
