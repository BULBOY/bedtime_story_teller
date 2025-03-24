import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from 'src/lib/firebase/firebase_conf';
import { doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
      const { email, password } = await request.json();
      
      // Validate inputs
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }
      
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Return success response with user info (excluding sensitive data)
      const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    let role = 'child'; // Default role
    
    if (userDoc.exists()) {
      // If the user document exists, get the role
      role = userDoc.data().role || 'child';
    } else {
      // If the user document doesn't exist, create one with default role
      // Note: In a real app, you might want to handle this differently
      console.warn(`User document for ${user.uid} not found`);
    }
    
    // Return success response with user info including role
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        role: role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error.code, error.message);
    
    // Handle specific Firebase auth errors
    let errorMessage = 'Login failed';
    let statusCode = 401;
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      // Don't distinguish between wrong email and wrong password for security
      errorMessage = 'Invalid email or password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email format';
      statusCode = 400;
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many unsuccessful login attempts. Please try again later';
      statusCode = 429;
    }
    
    return NextResponse.json(
      { error: errorMessage, code: error.code },
      { status: statusCode }
    );
  }
}