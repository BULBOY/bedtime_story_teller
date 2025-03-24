"use client";
import { useState } from "react";
import Form from "../components/Form";
import TextInput from "../components/TextInput";
import Button from "../components/Button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  
  // Redirect if already logged in
  if (session) {
    const destination = session.user.role === 'parent' ? '/parent/dashboard' : '/child/dashboard';
    router.push(destination);
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      
      if (result.error) {
        throw new Error(result.error || "Invalid email or password");
      }
      
      // Login successful - get updated session
      // NextAuth automatically stores the session data
      console.log('Login successful');
      
      // We'll refresh the page to get the new session
      // The router will handle the redirect based on role in the useEffect above
      router.refresh();
      
    } catch (error) {
      setError(error.message);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container-base">
      <h2>Log In</h2>
      {error && <div className="error-message">{error}</div>}
      <Form onSubmit={handleSubmit}>
        <TextInput 
          label="Email Address" 
          type="email" 
          placeholder="Enter your email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required
        />
        <TextInput 
          label="Password" 
          type="password" 
          placeholder="Enter your password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </Button>
      </Form>
      <div className="form-footer">
        <p>Don't have an account? <Link href="/signup">Sign up</Link></p>
        <p><Link href="/forgot-password">Forgot password?</Link></p>
      </div>
    </div>
  );
}