"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const router = useRouter();

  const handleLogout = async () => {
    // Sign out and redirect to home page
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <header className="header">
      <nav className="nav">
        <Link href="/" className="nav-link">
          Home
        </Link>
        <Link href="/about" className="nav-link">
          About
        </Link>
        <Link href="/contact" className="nav-link">
          Contact
        </Link>
        
        {/* Role-specific navigation */}
        {isAuthenticated && session.user.role === 'child' && (
          <Link href="/child/dashboard" className="nav-link">
            Child Dashboard
          </Link>
        )}
        
        {isAuthenticated && session.user.role === 'parent' && (
          <Link href="/parent/dashboard" className="nav-link">
            Parent Dashboard
          </Link>
        )}
        
        {/* Authentication links */}
        {isAuthenticated ? (
          <div className="auth-section">
            <span className="user-info">
              {session.user.name || session.user.email}
              {/* <span className="role-badge">{session.user.role}</span> */}
            </span>
            <button onClick={handleLogout} className="logout-button nav-link">
              Logout
            </button>
          </div>
        ) : (
         <></>
        )}
      </nav>
    </header>
  );
}