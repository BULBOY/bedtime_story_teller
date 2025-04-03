// app/api/health/route.js
import { NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { auth, db } from 'src/lib/firebase/firebase_conf';

export async function GET() {
  try {
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
      authInitialized: auth ? true : false,
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