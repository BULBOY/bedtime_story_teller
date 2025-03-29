import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiting configuration
const rateLimits = {
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,     // 30 requests per minute
    clients: new Map()
  },
  storyGeneration: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,      // 5 requests per minute
    clients: new Map()
  }
};

/**
 * Rate limiter function
 * @param {string} type - The type of rate limit to apply ('general' or 'storyGeneration')
 * @param {string} clientId - Client identifier (IP address or session ID)
 * @returns {boolean} - Returns true if the request is allowed, false if rate limited
 */
export function checkRateLimit(type, clientId) {
  const limiter = rateLimits[type] || rateLimits.general;
  const now = Date.now();
  
  // Clean up old entries
  for (const [client, data] of limiter.clients.entries()) {
    if (now - data.timestamp > limiter.windowMs) {
      limiter.clients.delete(client);
    }
  }
  
  // Get or create client data
  const clientData = limiter.clients.get(clientId) || { 
    count: 0, 
    timestamp: now 
  };
  
  // Check if client exceeds rate limit
  if (clientData.count >= limiter.maxRequests) {
    return false;
  }
  
  // Update client data
  clientData.count++;
  limiter.clients.set(clientId, clientData);
  
  return true;
}

/**
 * Default story when AI generation fails
 * @param {number} age - Age of the child
 * @param {string} theme - Theme of the story
 * @returns {string} - A simple fallback story
 */
export function getDefaultStory(age, theme) {
  return `Once upon a time, there was a ${age}-year-old child who loved stories about ${theme}. 
  They had many wonderful adventures and learned valuable lessons along the way.
  Every night before bed, they would dream about new ${theme} adventures.
  And as they closed their eyes tonight, they knew tomorrow would bring new and exciting discoveries.
  The End.`;
}

/**
 * Generate default tags when tag generation fails
 * @param {number} age - Age of the child
 * @param {string} theme - Theme of the story
 * @returns {string[]} - Default tags
 */
export function getDefaultTags(age, theme) {
  const ageCategory = age <= 5 ? 'young-children' : age <= 10 ? 'children' : 'pre-teen';
  return [theme.toLowerCase(), ageCategory, `age-${age}`, 'bedtime', 'story'];
}

// Initialize Google AI with environment variable
const getGoogleAI = () => {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_AI_API_KEY is not set');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

// Variable to store the last successful model for reuse
let lastSuccessfulModel = null;

// Generate a story based on parameters
export async function generateStory(prompt, age, theme = 'adventure', length = 'medium') {
  try {
    console.log('Starting story generation with Google AI...');
    const googleAI = getGoogleAI();
    
    if (!googleAI) {
      return getDefaultStory(age, theme);
    }
    
    // Configure token limits based on length
    const maxOutputTokens = length === 'short' ? 500 : length === 'medium' ? 1000 : 1500;
    
    // Create the system prompt
    const systemPrompt = `Create a bedtime story for a ${age}-year-old child about ${theme}. 
    The story should be ${length} in length, appropriate for children, have a positive message, 
    and end with a calming conclusion suitable for bedtime.`;
    
    // Combine the prompt
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    
    // Try different model options
    const modelOptions = ["gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
    
    // Try each model until one works
    for (const modelName of modelOptions) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = googleAI.getGenerativeModel({ model: modelName });
        
        const generationConfig = {
          temperature: 0.7,
          maxOutputTokens: maxOutputTokens,
        };
        
        const parts = [{ text: fullPrompt }];
        
        const result = await model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig,
        });
        
        const response = result.response;
        const text = response.text();
        console.log(`Generated story of length: ${text.length} characters`);
        
        // Store the successful model name for future use
        lastSuccessfulModel = modelName;
        
        return text;
      } catch (modelError) {
        console.log(`Error with model ${modelName}:`, modelError.message);
        // Continue to the next model option
      }
    }
    
    // If all models failed
    return getDefaultStory(age, theme);
    
  } catch (error) {
    console.error('Story generation failed:', error.message);
    return getDefaultStory(age, theme);
  }
}

// Edit an existing story
export async function editStory(existingStory, editInstructions, age, theme = 'adventure', length = 'medium') {
  try {
    console.log(`Attempting to edit a story with Google AI...`);
    
    const googleAI = getGoogleAI();
    if (!googleAI) {
      return existingStory + "\n\n[Note: We couldn't apply your edits at this time. Please try again later.]";
    }
    
    // Create the system prompt for editing
    const systemPrompt = `Edit the following children's bedtime story according to these instructions: "${editInstructions}".
    The story should remain appropriate for a ${age}-year-old child, maintain the theme of ${theme},
    keep a ${length} length, have a positive message, and end with a calming conclusion suitable for bedtime.`;
    
    // Combine the prompt with the existing story
    const fullPrompt = `${systemPrompt}\n\nExisting story:\n${existingStory}`;
    
    // Use the last successful model if available, or try primary model first, then fallback
    const modelToUse = lastSuccessfulModel || "gemini-1.5-pro";
    
    try {
      const model = googleAI.getGenerativeModel({ model: modelToUse });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: length === 'short' ? 500 : length === 'medium' ? 1000 : 1500,
        },
      });
      
      return result.response.text();
    } catch (error) {
      // Try alternative model if the preferred one fails
      const fallbackModel = modelToUse === "gemini-1.5-pro" ? "gemini-pro" : "gemini-1.5-pro";
      
      const model = googleAI.getGenerativeModel({ model: fallbackModel });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: length === 'short' ? 500 : length === 'medium' ? 1000 : 1500,
        },
      });
      
      return result.response.text();
    }
  } catch (error) {
    console.error('Error in editStory:', error);
    return existingStory + "\n\n[Note: We couldn't apply your edits at this time. Please try again later.]";
  }
}

// Generate tags for a story
export async function generateTags(story, age, theme) {
  try {
    console.log(`Generating tags for story with theme: ${theme} for age: ${age}`);
    
    // Create age category
    let ageCategory = '';
    if (age <= 3) ageCategory = 'toddler';
    else if (age <= 5) ageCategory = 'preschool';
    else if (age <= 8) ageCategory = 'early-reader';
    else if (age <= 12) ageCategory = 'middle-grade';
    else ageCategory = 'young-adult';
    
    // Base tags from known information
    const baseTags = [
      theme.toLowerCase(),
      ageCategory,
      `age-${age}`
    ];
    
    const googleAI = getGoogleAI();
    if (!googleAI) {
      return getDefaultTags(age, theme);
    }
    
    // Try to generate additional tags using Google AI
    try {
      // Use the model that was successful for story generation if available
      const modelToUse = lastSuccessfulModel || "gemini-1.5-pro";
      
      const model = googleAI.getGenerativeModel({ model: modelToUse });
      
      const prompt = `
      Read the following children's story and generate 3-5 relevant tags (single words or short phrases) 
      describing key elements, characters, emotions, or settings in the story. 
      Provide ONLY the tags as a comma-separated list with no additional text or explanation.
      
      Story: ${story.substring(0, 2000)}`;  // Limit to first 2000 chars for token efficiency
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 100,
        },
      });
      
      const aiTagsText = result.response.text().trim();
      
      // Process AI tags
      const aiTags = aiTagsText
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && tag.length < 30); // Filter out empty or extremely long tags
      
      // Combine base tags with AI-generated tags, remove duplicates
      return [...new Set([...baseTags, ...aiTags])];
    } catch (error) {
      console.error('Error generating AI tags:', error);
      
      // If the preferred model fails, try an alternative model
      try {
        const fallbackModel = modelToUse === "gemini-1.5-pro" ? "gemini-pro" : "gemini-1.5-pro";
        const model = googleAI.getGenerativeModel({ model: fallbackModel });
        
        const prompt = `
        Generate 3-5 relevant tags for a children's story about ${theme} for a ${age}-year-old.
        Provide ONLY the tags as a comma-separated list with no additional text.`;
        
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 100,
          },
        });
        
        const aiTagsText = result.response.text().trim();
        
        // Process AI tags
        const aiTags = aiTagsText
          .split(',')
          .map(tag => tag.trim().toLowerCase())
          .filter(tag => tag.length > 0 && tag.length < 30);
        
        return [...new Set([...baseTags, ...aiTags])];
      } catch (fallbackError) {
        console.error('Fallback tag generation failed:', fallbackError);
        return baseTags;
      }
    }
  } catch (error) {
    console.error('Error in generateTags:', error);
    return getDefaultTags(age, theme);
  }
}