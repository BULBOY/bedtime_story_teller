// app/api/user-stories/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import { getStoriesByUserId } from '../lib/firebase-service';

export async function GET(request) {
  try {
    // Get user from session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    // Use the user ID from the session
    const userId = session.user.id || session.user.sub;
    
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    const result = await getStoriesByUserId(userId, {
      limit,
      page,
      sortBy,
      sortOrder
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user stories:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user stories', 
      message: error.message 
    }, { status: 500 });
  }
}