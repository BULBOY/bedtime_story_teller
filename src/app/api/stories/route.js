// app/api/stories/route.js
import { NextResponse } from 'next/server';
import { getStories } from '../lib/firebase-service';

export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const tags = searchParams.get('tags');
    const category = searchParams.get('category');
    const ageMin = searchParams.get('ageMin');
    const ageMax = searchParams.get('ageMax');
    const theme = searchParams.get('theme');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const userId = searchParams.get('userId'); // Get userId from query params
    
    // Get stories from Firebase with filters
    const { stories, total, totalPages } = await getStories({
      limit,
      page,
      tags,
      category,
      ageMin,
      ageMax,
      theme,
      sortBy,
      sortOrder,
      userId  // Pass userId to filter by user
    });
    
    // Return the stories with pagination metadata
    return NextResponse.json({
      success: true,
      total,
      page: page,
      limit: limit,
      totalPages,
      stories
    });
  } catch (error) {
    console.error('Error retrieving stories:', error);
    return NextResponse.json({
      error: 'Failed to retrieve stories',
      message: error.message
    }, { status: 500 });
  }
}