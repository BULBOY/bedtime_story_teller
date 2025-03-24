import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth , db} from 'src/lib/firebase/firebase_conf';
import { NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { name, email, password, role = 'child' } = await request.json();
    
    // Server-side validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (role && role !== 'parent' && role !== 'child') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "parent" or "child"' },
        { status: 400 }
      );
    }
    
    // Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update user profile with name
    await updateProfile(userCredential.user, { displayName: name });

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      role,
      createdAt: new Date().toISOString()
    });
    
    // Return success response (without sensitive data)
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name,
        role
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle specific Firebase errors with detailed messages
    let errorMessage = 'Failed to create user';
    let statusCode = 500;
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      statusCode = 409;
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use at least 6 characters with a mix of letters, numbers, and symbols.';
      statusCode = 400;
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address. Please enter a valid email.';
      statusCode = 400;
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your connection and try again.';
      statusCode = 503;
    }
    
    return NextResponse.json(
      { error: errorMessage, code: error.code },
      { status: statusCode }
    );
  }
}