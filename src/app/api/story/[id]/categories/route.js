// app/api/story/[id]/categories/route.js
import { NextResponse } from 'next/server';
import { getStory, updateStory } from '../../../lib/firebase-service';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { categories } = body;
    
    // Check if story exists
    const storyData = await getStory(id);
    if (!storyData) {
      return NextResponse.json({
        error: 'Story not found',
        message: `No story found with ID: ${id}`
      }, { status: 404 });
    }
    
    // Validate categories
    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({
        error: 'Invalid categories',
        message: 'Please provide an array of categories'
      }, { status: 400 });
    }
    
    // Update metadata
    const updatedMetadata = {
      ...storyData.metadata,
      categories: categories,
      lastCategoryUpdate: new Date().toISOString()
    };
    
    // Update the story in Firebase
    await updateStory(id, { metadata: updatedMetadata });
    
    // Return success
    return NextResponse.json({
      success: true,
      id,
      categories
    });
  } catch (error) {
    console.error('Error updating categories:', error);
    return NextResponse.json({
      error: 'Failed to update categories',
      message: error.message
    }, { status: 500 });
  }
}