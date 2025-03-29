// app/api/health/route.js
import { NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUgpEh6RKaXYXodGpiEMBS0_NB6mxOxeg",
  authDomain: "bedtime-story-teller-cc53b.firebaseapp.com",
  projectId: "bedtime-story-teller-cc53b",
  storageBucket: "bedtime-story-teller-cc53b.firebasestorage.app",
  messagingSenderId: "710677768387",
  appId: "1:710677768387:web:d19d38e479dd56a298da76"
};

export async function GET() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Check Firebase connection by querying a small amount of data
    const storiesRef = collection(db, 'stories');
    const q = query(storiesRef, limit(1));
    await getDocs(q);
    
    // Count stories
    const allStoriesSnap = await getDocs(storiesRef);
    const storyCount = allStoriesSnap.size;
    
    // Check API key configuration
    const apiKeyPresent = process.env.GOOGLE_AI_API_KEY ? true : false;
    
    return NextResponse.json({ 
      status: 'ok',
      apiConfigured: apiKeyPresent,
      databaseConnected: true,
      storyCount: storyCount,
      uptime: Math.floor(process.uptime()) + ' seconds'
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({ 
      status: 'error',
      apiConfigured: process.env.GOOGLE_AI_API_KEY ? true : false,
      databaseConnected: false,
      error: error.message,
      uptime: Math.floor(process.uptime()) + ' seconds'
    }, { status: 500 });
  }
}