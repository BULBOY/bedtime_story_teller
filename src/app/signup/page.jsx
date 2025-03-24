"use client";
import { useState } from "react";
import Form from "@components/Form";
import TextInput from "@components/TextInput";
import Button from "@components/Button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("child"); // Default role
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    // Client-side validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      // Registration successful
      console.log('Registration successful:', data);
      alert(`Signed up successfully as: ${name}(${role})`);
      
      // Redirect to login page or dashboard
      router.push('/login');
      
    } catch (error) {
      setError(error.message);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container-base">
      <h2>Sign Up</h2>
      {error && <div className="error-message">{error}</div>}
      <Form onSubmit={handleSubmit}>
        <TextInput 
          label="Full Name" 
          placeholder="Enter your name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required
        />
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
          placeholder="Create a password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required
          minLength="6"
        />

        <div >
          <label className="form-role">I am a:</label>
          <div className="role-selection">
            <label className="form-role">
              <input
                type="radio"
                name="role"
                value="parent"
                checked={role === "parent"}
                onChange={() => setRole("parent")}
              />
              <span> Parent</span>
            </label>
            <label className="form-role">
              <input
                type="radio"
                name="role"
                value="child"
                checked={role === "child"}
                onChange={() => setRole("child")}
              />
              <span> Child</span>
            </label>
          </div>
        </div>

        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </Button>
      </Form>
      <div className="form-footer">
        <p>Have an account? <Link href="/login">Log in</Link></p>
      </div>
    </div>
  );
}