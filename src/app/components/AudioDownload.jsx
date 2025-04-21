"use client";
import React from 'react';

export default function AudioDownload({ src, fileName = "story.mp3" }) {
  return (
    <div className="audio-download-container">
      <a
        href={src}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="button primary download-button"
      >
        Download Audio
      </a>
    </div>
  );
}