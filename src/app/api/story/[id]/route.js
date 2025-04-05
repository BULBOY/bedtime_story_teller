// app/api/story/[id]/route.js
import { NextResponse } from 'next/server';
import { 
  checkRateLimit,
  editStory, 
  generateTags
} from '../../lib/core-services';
import { 
  getStory, 
  updateStory, 
  deleteStory 
} from '../../lib/firebase-service';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Get the story from Firebase
    const storyData = await getStory(id);
    
    // Check if story exists
    if (!storyData) {
      return NextResponse.json({
        error: 'Story not found',
        message: `No story found with ID: ${id}`
      }, { status: 404 });
    }
    
    // Return the story
    return NextResponse.json({
      success: true,
      id,
      story: storyData.story,
      metadata: storyData.metadata
    });
  } catch (error) {
    console.error('Error retrieving story:', error);
    return NextResponse.json({
      error: 'Failed to retrieve story',
      message: error.message
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limits
    if (!checkRateLimit('storyGeneration', clientIp)) {
      return NextResponse.json({
        error: 'Too Many Requests', 
        message: 'Story editing rate limit exceeded. Please try again in 60 seconds.'
      }, { status: 429, headers: { 'Retry-After': '60' } });
    }
    
    // Parse request body
    const body = await request.json();
    const { editInstructions, customTags, addTags, removeTags, categories } = body;
    
    // Get the existing story
    const storyData = await getStory(id);
    
    // Check if story exists
    if (!storyData) {
      return NextResponse.json({
        error: 'Story not found',
        message: `No story found with ID: ${id}`
      }, { status: 404 });
    }
    
    // Validate edit instructions
    if (!editInstructions) {
      return NextResponse.json({
        error: 'Missing edit instructions',
        message: 'Please provide editInstructions in the request body'
      }, { status: 400 });
    }
    
    const { story, metadata } = storyData;
    
    // Edit the story
    const editedStory = await editStory(
      story,
      editInstructions,
      metadata.age,
      metadata.theme,
      metadata.length
    );
    
    // Get current tags or initialize empty array
    let currentTags = metadata.tags || [];
    
    // Handle tag operations
    if (customTags) {
      // Replace all tags with custom tags
      currentTags = customTags.map(tag => tag.toLowerCase());
    } else {
      // Add new tags if specified
      if (addTags && addTags.length > 0) {
        const newTags = addTags.map(tag => tag.toLowerCase());
        currentTags = [...new Set([...currentTags, ...newTags])];
      }
      
      // Remove tags if specified
      if (removeTags && removeTags.length > 0) {
        const tagsToRemove = removeTags.map(tag => tag.toLowerCase());
        currentTags = currentTags.filter(tag => !tagsToRemove.includes(tag));
      }
      
      // If significant edits were made, regenerate tags
      if (editInstructions.length > 20) {
        try {
          const regeneratedTags = await generateTags(editedStory, metadata.age, metadata.theme);
          // Merge while preserving manually added tags
          currentTags = [...new Set([...currentTags, ...regeneratedTags])];
        } catch (error) {
          console.error('Error regenerating tags after edit:', error);
          // Continue with existing tags
        }
      }
    }
    
    // Get current categories or initialize empty array
    let currentCategories = metadata.categories || [];
    
    // Update categories if provided
    if (categories) {
      currentCategories = categories;
    }
    
    // Create updated story object
    const updatedStoryData = {
      story: editedStory,
      metadata: {
        ...metadata,
        lastEdited: new Date().toISOString(),
        editInstructions,
        tags: currentTags,
        categories: currentCategories
      }
    };
    
    // Update the story in Firebase
    await updateStory(id, updatedStoryData);
    
    // Return the edited story
    return NextResponse.json({
      success: true,
      id,
      story: editedStory,
      metadata: {
        ...metadata,
        lastEdited: new Date().toISOString(),
        tags: currentTags,
        categories: currentCategories
      }
    });
  } catch (error) {
    console.error('Error in edit-story endpoint:', error);
    return NextResponse.json({
      error: 'Failed to edit story',
      message: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Check if story exists
    const storyData = await getStory(id);
    console.log(storyData);
    if (!storyData) {
      return NextResponse.json({
        error: 'Story not found',
        message: `No story found with ID: ${id}`
      }, { status: 404 });
    }
    
    // Delete from Firebase
    await deleteStory(id);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: `Story with ID ${id} has been successfully deleted`
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json({
      error: 'Failed to delete story',
      message: error.message
    }, { status: 500 });
  }
}