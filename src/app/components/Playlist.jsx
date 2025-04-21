import React from 'react';
import AudioPlayer from './AudioPlayer';

export default function Playlist({ tracks = [], onRemoveTrack }) {
  if (!tracks.length) {
    return <p>No audio tracks available.</p>;
  }

  return (
    <div className="playlist">
      <h3>Playlist ({tracks.length} tracks)</h3>
      <ul className="playlist-items">
        {tracks.map((track) => (
          <li key={track.id} className="playlist-item">
            <div className="playlist-item-header">
              <span className="playlist-item-title">{track.title}</span>
              
              <button
                onClick={() => onRemoveTrack(track.id)}
                className="button secondary"
              >
                Remove
              </button>
            </div>
            
            <AudioPlayer src={track.src} downloadFileName={`${track.title}.mp3`} />
          </li>
        ))}
      </ul>
    </div>
  );
}