// app/api/generate-story/route.js
import { NextResponse } from 'next/server';
import { 
  checkRateLimit,
  generateStory, 
  generateTags 
} from '../lib/core-services';

export async function POST(request) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limits
    if (!checkRateLimit('general', clientIp)) {
      return NextResponse.json({
        error: 'Too Many Requests', 
        message: 'Rate limit exceeded. Please try again in 60 seconds.'
      }, { status: 429, headers: { 'Retry-After': '60' } });
    }
    
    if (!checkRateLimit('storyGeneration', clientIp)) {
      return NextResponse.json({
        error: 'Too Many Requests', 
        message: 'Story generation rate limit exceeded. Please try again in 60 seconds.'
      }, { status: 429, headers: { 'Retry-After': '60' } });
    }
    
    // Parse request body
    const body = await request.json();
    const { prompt, age, theme, length, categories, customTags, title } = body;
    
    // Validate required parameters
    if (!prompt || !age || !theme) {
      return NextResponse.json({ 
        error: 'Missing required parameters. Please provide prompt, age, and theme.' 
      }, { status: 400 });
    }
    
    // Generate the story
    const story = await generateStory(prompt, age, theme, length || 'medium');
    
    // Generate tags
    const generatedTags = await generateTags(story, age, theme);
    
    // Combine with any custom tags provided by the user
    const tags = customTags ? [...generatedTags, ...customTags.map(tag => tag.toLowerCase())] : generatedTags;
    
    // Add any custom categories
    const storyCategories = categories || [];
    
    // Create a temporary ID (will be used for saving later)
    const storyId = Date.now().toString();
    
    // Return the story with its ID and tags
    return NextResponse.json({ 
      success: true, 
      id: storyId,
      story,
      metadata: {
        title,
        provider: 'google',
        age,
        theme,
        length: length || 'medium',
        prompt,
        tags,
        categories: storyCategories
      }
    });
  } catch (error) {
    console.error('Error in generate-story endpoint:', error);
    return NextResponse.json({ 
      error: 'Failed to generate story', 
      message: error.message 
    }, { status: 500 });
  }
}