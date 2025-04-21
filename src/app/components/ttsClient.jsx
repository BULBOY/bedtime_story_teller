// src/app/components/ttsClient.js

/**
 * Converts story text to audio using the API
 * @param {string} text - The story text to convert
 * @param {string} voiceName - The voice to use
 * @param {number} pitch - The pitch value (default 0)
 * @param {number} speakingRate - The speaking rate
 * @param {string} storyId - Optional story ID for storage
 * @returns {Promise<string>} URL to the generated audio
 */
export async function convertStory(
    text,
    voiceName = "en-US-Wavenet-D",
    pitch = 0, // Default pitch value
    speakingRate = 1,
    storyId = undefined
  ) {
    try {
      // Extract language code from voice name (e.g., en-US-Wavenet-D -> en-US)
      const languageCode = voiceName.split('-').slice(0, 2).join('-');
      
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice: {
            name: voiceName,
            languageCode: languageCode,
          },
          audioConfig: {
            audioEncoding: "MP3",
            pitch, // Using default value of 0
            speakingRate,
          },
          storyId,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate audio");
      }
  
      const data = await response.json();
      return data.audioUrl;
    } catch (error) {
      console.error("Error in convertStory:", error);
      throw error;
    }
  }