"use client";
import React, { useEffect, useRef, useState } from "react";
import AudioDownload from "./AudioDownload";

export default function AudioPlayer({ src, downloadFileName = "story.mp3" }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => setProgress(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onError = (e) => setError("Error loading audio file");

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("error", onError);
    };
  }, [src]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => setError("Failed to play audio"));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const newTime = Number(e.target.value);
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const handleSpeedChange = (e) => {
    const speed = Number(e.target.value);
    audioRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  if (error) {
    return <div className="audio-error">Error: {error}</div>;
  }

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} />
      <div className="controls">
        <button className="button primary" onClick={togglePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <div className="progress-container">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={handleSeek}
            step={0.1}
            className="progress-slider"
          />
          <span className="time-display">
            {Math.floor(progress)} / {Math.floor(duration || 0)} sec
          </span>
        </div>
        <div className="playback-controls">
          <label htmlFor="speed-select">Speed: </label>
          <select
            id="speed-select"
            value={playbackSpeed}
            onChange={handleSpeedChange}
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      </div>
      
      {/* Single download button */}
      <AudioDownload src={src} fileName={downloadFileName} />
    </div>
  );
}