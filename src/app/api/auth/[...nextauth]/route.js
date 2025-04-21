// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from 'src/lib/firebase/firebase_conf';
import { doc, getDoc } from "firebase/firestore";

// Try to access Firebase Functions config if available
const getNextAuthSecret = () => {
  try {
    // Check if we're in a Firebase Functions environment
    if (typeof process.env.FUNCTION_TARGET !== 'undefined') {
      const functions = require('firebase-functions');
      return functions.config().nextauth?.secret;
    }
    return process.env.NEXTAUTH_SECRET;
  } catch (error) {
    console.error("Error accessing NextAuth secret:", error);
    return process.env.NEXTAUTH_SECRET;
  }
};

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
          
          // Determine the base URL (prefer Firebase function config if available)
          const baseUrl = (() => {
            try {
              if (typeof process.env.FUNCTION_TARGET !== 'undefined') {
                const functions = require('firebase-functions');
                return functions.config().nextauth?.url;
              }
              return process.env.NEXTAUTH_URL || 'http://localhost:3000';
            } catch (error) {
              console.error("Error accessing NextAuth URL:", error);
              return process.env.NEXTAUTH_URL || 'http://localhost:3000';
            }
          })();
          
          // Perform health check after successful authentication
          try {
            // This is a server-side function, so we need to use absolute URL
            const healthResponse = await fetch(`${baseUrl}/api/health`);
            const healthData = await healthResponse.json();
            
            // Log health status for monitoring
            console.log('System health on login:', healthData);
            
            // You could also log this to your monitoring system
          } catch (healthError) {
            // Don't fail login if health check fails
            console.error('Health check failed during login:', healthError);
          }
          
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
  },
  // Get secret from Firebase Functions config or environment variable
  secret: getNextAuthSecret()
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };