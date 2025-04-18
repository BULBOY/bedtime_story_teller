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
    const { 
      editInstructions, 
      customTags, 
      addTags, 
      removeTags, 
      categories,
      title,
      prompt,
      age,
      theme,
      length
    } = body;
    
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
      age || metadata.age,
      theme || metadata.theme,
      length || metadata.length
    );
    
    // Generate fresh tags based on the edited story
    let generatedTags = [];
    try {
      // Use the existing generateTags function from core-services
      generatedTags = await generateTags(
        editedStory, 
        age || metadata.age, 
        theme || metadata.theme
      );
    } catch (tagError) {
      console.error('Error generating tags for updated story:', tagError);
      // Continue with existing tags if generation fails
      generatedTags = [];
    }
    
    // Handle tag operations
    let currentTags = [];
    
    if (customTags && customTags.length > 0) {
      // If custom tags were provided, merge them with generated tags
      const lowerCustomTags = customTags.map(tag => tag.toLowerCase());
      currentTags = [...new Set([...generatedTags, ...lowerCustomTags])];
    } else if (generatedTags.length > 0) {
      // If only generated tags are available, use those
      currentTags = generatedTags;
    } else {
      // Fallback to the existing tags if nothing else is available
      currentTags = metadata.tags || [];
      
      // Add/remove specific tags if requested
      if (addTags && addTags.length > 0) {
        const newTags = addTags.map(tag => tag.toLowerCase());
        currentTags = [...new Set([...currentTags, ...newTags])];
      }
      
      if (removeTags && removeTags.length > 0) {
        const tagsToRemove = removeTags.map(tag => tag.toLowerCase());
        currentTags = currentTags.filter(tag => !tagsToRemove.includes(tag));
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
        // Update these fields if they were provided in the request
        title: title !== undefined ? title : metadata.title,
        prompt: prompt !== undefined ? prompt : metadata.prompt,
        age: age !== undefined ? age : metadata.age,
        theme: theme !== undefined ? theme : metadata.theme,
        length: length !== undefined ? length : metadata.length,
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
      metadata: updatedStoryData.metadata
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