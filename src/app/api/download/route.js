// src/app/api/download/route.js
import { NextResponse } from "next/server";
import https from 'https';

/**
 * API route to handle audio file downloads
 * This opens the file in a new tab with proper headers
 */
export async function GET(request) {
  try {
    // Get URL from query parameters
    const url = new URL(request.url);
    const fileUrl = url.searchParams.get('url');
    const fileName = url.searchParams.get('filename') || 'audio.mp3';
    
    if (!fileUrl) {
      return NextResponse.json({ error: "Missing file URL" }, { status: 400 });
    }
    
    console.log("Downloading file from:", fileUrl);
    
    // For security and CORS reasons, proxy the request through our API
    return new Promise((resolve) => {
      https.get(fileUrl, (response) => {
        // Check if the response is successful
        if (response.statusCode !== 200) {
          return resolve(NextResponse.json(
            { error: `Failed to download file: ${response.statusCode}` },
            { status: response.statusCode }
          ));
        }
        
        // Get content type from response
        const contentType = response.headers['content-type'] || 'audio/mp3';
        
        // Create a stream to pipe the response through
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          // Return the file with appropriate headers
          resolve(new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${fileName}"`,
              'Cache-Control': 'no-cache',
            },
          }));
        });
      }).on('error', (err) => {
        console.error("Error downloading file:", err);
        resolve(NextResponse.json({ error: "Failed to download file" }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
};