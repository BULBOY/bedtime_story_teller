// src/app/api/generate-audio/route.js
import { NextResponse } from "next/server";
import { getStorage } from "firebase/storage";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app, db } from 'src/lib/firebase/firebase_conf';
import fs from 'fs';
import path from 'path';
import os from 'os';
import util from 'util';
import { checkRateLimit } from '../lib/core-services';

// Dynamically import TextToSpeech - this is necessary because it's a server-only module
let textToSpeech;
try {
  textToSpeech = require("@google-cloud/text-to-speech");
} catch (error) {
  console.error("Failed to import @google-cloud/text-to-speech:", error);
}

// For local file operations
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

// Initialize TTS client
let ttsClient = null;
try {
  if (textToSpeech) {
    ttsClient = new textToSpeech.TextToSpeechClient({
      credentials: {
        client_email: process.env.GOOGLE_TTS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_TTS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
    console.log("TTS client initialized");
  }
} catch (error) {
  console.error("Error initializing TTS client:", error);
}

export async function POST(request) {
  console.log("🎙️ Audio generation request received");
  
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
    
    // Check if TTS client is initialized
    if (!ttsClient) {
      console.error("TTS client not initialized");
      return NextResponse.json(
        { error: "TTS service not initialized" },
        { status: 500 }
      );
    }
    
    // Initialize Firebase Storage
    const storage = getStorage(app);
    
    // Parse request body
    const body = await request.json();
    const { text, voice, audioConfig, storyId } = body;
    
    if (!text || !text.trim()) {
      console.error("Missing text in request");
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }
    
    console.log("Processing TTS request, text length:", text.length);
    
    // Prepare TTS request
    const ttsRequest = {
      input: { text },
      voice: voice || {
        languageCode: "en-US",
        name: "en-US-Wavenet-D",
      },
      audioConfig: audioConfig || {
        audioEncoding: "MP3",
        pitch: 0,
        speakingRate: 1,
      },
    };
    
    console.log("Sending request to Google TTS API...");
    
    // Generate audio from text
    const [response] = await ttsClient.synthesizeSpeech(ttsRequest);
    
    if (!response || !response.audioContent || response.audioContent.length === 0) {
      console.error("No audio content returned from Google TTS");
      return NextResponse.json(
        { error: "Failed to generate audio content" },
        { status: 500 }
      );
    }
    
    const audioContent = response.audioContent;
    console.log("✅ Audio content received, size:", audioContent.length, "bytes");
    
    // Create temporary file path
    const tempFilePath = path.join(os.tmpdir(), `story-${Date.now()}.mp3`);
    console.log("Writing audio to temp file:", tempFilePath);
    
    // Write audio to temporary file
    await writeFile(tempFilePath, audioContent);
    console.log("Audio written to temporary file successfully");
    
    // Generate unique filename in Firebase Storage
    const fileName = storyId 
  ? `audio/${storyId}.mp3`  // Use storyId as filename if available
  : `audio/temp-${Date.now()}.mp3`; // Fallback for cases where no ID is provided

      console.log("Uploading to Firebase Storage as:", fileName);
    
    // Create a storage reference
    const storageRef = ref(storage, fileName);
    
    // Read the file and upload it
    const fileBuffer = fs.readFileSync(tempFilePath);
    await uploadBytes(storageRef, fileBuffer, {
      contentType: 'audio/mp3',
    });
    
    console.log("Upload to Firebase complete");
    
    // Get download URL
    const url = await getDownloadURL(storageRef);
    console.log("Download URL obtained:", url);
    
    // Clean up temporary file
    await unlink(tempFilePath).catch(e => console.error("Error removing temp file:", e));
    
    console.log("✅ Audio generation process complete");
    
    return NextResponse.json({ audioUrl: url });
  } catch (error) {
    console.error("🔴 Error in generate-audio API:", error);
    
    // Detailed error response
    return NextResponse.json(
      { 
        error: "Failed to generate audio", 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}