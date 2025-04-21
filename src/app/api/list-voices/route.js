// src/app/api/list-voices/route.js
import { NextResponse } from "next/server";
import path from 'path';

// Dynamically import TextToSpeech - this is necessary because it's a server-only module
let textToSpeech;
try {
  textToSpeech = require("@google-cloud/text-to-speech");
} catch (error) {
  console.error("Failed to import @google-cloud/text-to-speech:", error);
}

export async function GET() {
  try {
    console.log("Fetching available TTS voices");
    
    if (!textToSpeech) {
      return NextResponse.json({
        error: "TTS service not initialized",
        details: "Could not import @google-cloud/text-to-speech"
      }, { status: 500 });
    }
    
    // Initialize client using environment variables
    const ttsClient = new textToSpeech.TextToSpeechClient({
      credentials: {
        client_email: process.env.GOOGLE_TTS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_TTS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
    
    // List voices from Google TTS API
    const [response] = await ttsClient.listVoices({});
    const voices = response.voices || [];
    
    // Transform the response to be more user-friendly
    const formattedVoices = voices.map(voice => {
      // Extract language code and region
      const languageCode = voice.languageCodes[0] || "";
      const [language, region] = languageCode.split('-');
      
      // Add display name for each voice
      return {
        name: voice.name,
        languageCode: languageCode,
        ssmlGender: voice.ssmlGender,
        naturalSampleRateHertz: voice.naturalSampleRateHertz,
        // Create a human-readable display name
        displayName: `${voice.name} (${languageCode}, ${voice.ssmlGender})`,
        // Group by language for easier selection
        language,
        region,
      };
    });
    
    // Sort voices by language code and name
    formattedVoices.sort((a, b) => {
      if (a.languageCode === b.languageCode) {
        return a.name.localeCompare(b.name);
      }
      return a.languageCode.localeCompare(b.languageCode);
    });
    
    return NextResponse.json({
      voices: formattedVoices,
      count: formattedVoices.length
    });
  } catch (error) {
    console.error("Error fetching voices:", error);
    return NextResponse.json({
      error: "Failed to fetch voices",
      details: error.message
    }, { status: 500 });
  }
};