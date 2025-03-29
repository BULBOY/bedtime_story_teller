// app/api/save-story/route.js
import { NextResponse } from 'next/server';
import { saveStory } from '../lib/firebase-service';

export async function POST(request) {
  try {
    // Parse request body
    const storyData = await request.json();
    
    // Validate that we have the required data
    if (!storyData.id || !storyData.story || !storyData.metadata) {
      return NextResponse.json({ 
        error: 'Missing required story data' 
      }, { status: 400 });
    }
    
    // Add creation timestamp if not present
    if (!storyData.metadata.createdAt) {
      storyData.metadata.createdAt = new Date().toISOString();
    }
    
    // Save to Firebase
    await saveStory(storyData.id, {
      story: storyData.story,
      metadata: storyData.metadata
    });
    
    // Return success
    return NextResponse.json({ 
      success: true, 
      id: storyData.id,
      message: 'Story saved successfully'
    });
  } catch (error) {
    console.error('Error saving story:', error);
    return NextResponse.json({ 
      error: 'Failed to save story', 
      message: error.message 
    }, { status: 500 });
  }
}