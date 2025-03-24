// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from 'src/lib/firebase/firebase_conf';
import { doc, getDoc } from "firebase/firestore";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Authenticate with Firebase
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          const user = userCredential.user;
          
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          // Return user object with role
          return {
            id: user.uid,
            name: user.displayName || userData.name || "User",
            email: user.email,
            role: userData.role || "child", // Default role
            emailVerified: user.emailVerified,
            image: user.photoURL,
            parentId: userData.parentId
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Pass user role to token
      if (user) {
        token.role = user.role;
        token.parentId = user.parentId;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass token data to session
      if (session.user) {
        session.user.role = token.role;
        session.user.parentId = token.parentId;
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt"
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };