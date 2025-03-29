// app/api/tags/route.js
import { NextResponse } from 'next/server';
import { getAllTags } from '../lib/firebase-service';

export async function GET() {
  try {
    // Get all unique tags from Firebase
    const uniqueTags = await getAllTags();
    
    // Return all unique tags
    return NextResponse.json({
      success: true,
      count: uniqueTags.length,
      tags: uniqueTags
    });
  } catch (error) {
    console.error('Error retrieving tags:', error);
    return NextResponse.json({
      error: 'Failed to retrieve tags',
      message: error.message
    }, { status: 500 });
  }
}