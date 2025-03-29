// app/api/story/[id]/tags/route.js
import { NextResponse } from 'next/server';
import { getStory, updateStory } from '../../../lib/firebase-service';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { addTags, removeTags, replaceTags } = body;
    
    // Get the story from Firebase
    const storyData = await getStory(id);
    
    // Check if story exists
    if (!storyData) {
      return NextResponse.json({
        error: 'Story not found',
        message: `No story found with ID: ${id}`
      }, { status: 404 });
    }
    
    let currentTags = storyData.metadata.tags || [];
    
    // Handle tag operations
    if (replaceTags) {
      // Replace all tags
      currentTags = replaceTags.map(tag => tag.toLowerCase());
    } else {
      // Add new tags
      if (addTags && addTags.length > 0) {
        const newTags = addTags.map(tag => tag.toLowerCase());
        currentTags = [...new Set([...currentTags, ...newTags])];
      }
      
      // Remove tags
      if (removeTags && removeTags.length > 0) {
        const tagsToRemove = removeTags.map(tag => tag.toLowerCase());
        currentTags = currentTags.filter(tag => !tagsToRemove.includes(tag));
      }
    }
    
    // Update metadata
    const updatedMetadata = {
      ...storyData.metadata,
      tags: currentTags,
      lastTagUpdate: new Date().toISOString()
    };
    
    // Update the story in Firebase
    await updateStory(id, { metadata: updatedMetadata });
    
    // Return success
    return NextResponse.json({
      success: true,
      id,
      tags: currentTags
    });
  } catch (error) {
    console.error('Error updating tags:', error);
    return NextResponse.json({
      error: 'Failed to update tags',
      message: error.message
    }, { status: 500 });
  }
}