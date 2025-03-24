"use client"; 

import { useState, useRef } from "react";
import Button from "@components/Button";

export default function StoryPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="story-player-container">
      <h1 className="story-title">Now Playing: The Magic Forest</h1>
      
      <audio ref={audioRef}>
        <source src="/audio/sample-story.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      <div className="controls">
        <Button variant="primary" onClick={togglePlay}>
          {isPlaying ? "Pause" : "Play"}
        </Button>
      </div>
    </section>
  );
}
