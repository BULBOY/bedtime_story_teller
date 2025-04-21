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

import { getStorage, ref, deleteObject } from "firebase/storage";
import { app } from 'src/lib/firebase/firebase_conf';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
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
    const { id } = await params;
    
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
      length,
      // Add these fields for audio settings
      audioUrl,
      voiceName,
      speakingRate,
      updateMetadataOnly
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
    
    const { story, metadata } = storyData;
    
    // Handle metadata-only updates (like audio settings)
    if (updateMetadataOnly) {
      console.log("Metadata-only update requested for story:", id);
      
      const updatedMetadata = {
        metadata: {
          ...metadata,
          audioUrl: audioUrl || metadata.audioUrl,
          voiceName: voiceName || metadata.voiceName,
          speakingRate: speakingRate !== undefined ? speakingRate : metadata.speakingRate
        }
      };
      
      await updateStory(id, updatedMetadata);
      
      return NextResponse.json({
        success: true,
        id,
        story: story,
        metadata: updatedMetadata.metadata
      });
    }
    
    // Validate edit instructions for full updates
    if (!editInstructions) {
      return NextResponse.json({
        error: 'Missing edit instructions',
        message: 'Please provide editInstructions in the request body'
      }, { status: 400 });
    }
    
    // Get current tags or initialize empty array
    let currentTags = metadata.tags || [];
    
    // Handle tag operations first to have updated tags for story editing
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
    }
    
    // Edit the story with additional context from prompt and tags
    const editedStory = await editStory(
      story,
      editInstructions,
      age || metadata.age,
      theme || metadata.theme,
      length || metadata.length,
      prompt || metadata.prompt,
      currentTags
    );
    
    // If significant edits were made, regenerate tags based on new content
    if (editInstructions.length > 20 && !customTags) {
      try {
        const regeneratedTags = await generateTags(editedStory, age || metadata.age, theme || metadata.theme);
        // Merge while preserving manually added tags
        currentTags = [...new Set([...currentTags, ...regeneratedTags])];
      } catch (error) {
        console.error('Error regenerating tags after edit:', error);
        // Continue with existing tags
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
        audioUrl: audioUrl || metadata.audioUrl,
        voiceName: voiceName || metadata.voiceName,
        speakingRate: speakingRate !== undefined ? speakingRate : metadata.speakingRate,
        editInstructions,
        tags: currentTags,
        categories: currentCategories
      }
    };
    
    // Update the story in Firebase
    await updateStory(id, updatedStoryData);
    
    // Return the edited story with the UPDATED metadata
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
    
    // Delete the audio file from Firebase Storage if it exists
    if (storyData.metadata?.audioUrl) {
      try {
        console.log(`Attempting to delete audio file for story ${id}`);
        const storage = getStorage(app);
        
        // The audio file path should match how it was saved in generate-audio/route.js
        const audioPath = `audio/${id}.mp3`;
        const audioRef = ref(storage, audioPath);
        
        await deleteObject(audioRef);
        console.log(`Successfully deleted audio file: ${audioPath}`);
      } catch (audioError) {
        console.error('Error deleting audio file:', audioError);
        // Continue with story deletion even if audio deletion fails
      }
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