"use client"; 

import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import Button from "@components/Button";
import LoadingSpinner from "@components/LoadingSpinner";
import AudioPlayer from "@components/AudioPlayer";

export default function StoryPlayer() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [story, setStory] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  useEffect(() => {
    if (storyId) {
      fetchStory(storyId);
    }
  }, [storyId]);
  
  const fetchStory = async (id) => {
    try {
      setLoading(true);
      
      // Fetch story details
      const storyResponse = await fetch(`/api/story/${id}`);
      if (!storyResponse.ok) {
        throw new Error('Failed to fetch story');
      }
      
      const storyData = await storyResponse.json();
      setStory(storyData);
      
      // If the story has an audioUrl in its metadata, use that
      if (storyData.metadata?.audioUrl) {
        setAudioUrl(storyData.metadata.audioUrl);
      } else {
        // Otherwise, try to generate audio on the fly
        try {
          const { convertStory } = await import('@components/ttsClient');
          
          // Default voice settings if not specified in metadata
          const voiceName = storyData.metadata?.voiceName || "en-US-Wavenet-D";
          const speakingRate = storyData.metadata?.speakingRate || 1;
          
          const generatedAudioUrl = await convertStory(
            storyData.story,
            voiceName,
            0, // Default pitch
            Number(speakingRate),
            id
          );
          
          setAudioUrl(generatedAudioUrl);
        } catch (audioError) {
          console.error('Error generating audio:', audioError);
          // Continue without audio if generation fails
        }
      }
    } catch (error) {
      console.error('Error loading story:', error);
      setError(error.message || 'Error loading story');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="story-player-container">
        <div className="text-center py-8">
          <LoadingSpinner />
          <p className="mt-4 text-lg">Loading your story...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="story-player-container">
        <h1 className="story-title">Error</h1>
        <p className="text-red-500">{error}</p>
        <Button variant="primary" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </section>
    );
  }

  if (!story) {
    return (
      <section className="story-player-container">
        <h1 className="story-title">Story Not Found</h1>
        <p>Sorry, we couldn't find the story you're looking for.</p>
        <Button variant="primary" onClick={() => window.location.href = "/child/dashboard"}>
          Back to Dashboard
        </Button>
      </section>
    );
  }

  return (
    <section className="story-player-container">
      <h1 className="story-title">
        {story.metadata?.title || story.metadata?.theme?.charAt(0).toUpperCase() + story.metadata?.theme?.slice(1) || 'Bedtime Story'}
      </h1>
      
      <div className="story-content card">
        <div className="prose max-w-none">
          {story.story.split('\n').map((paragraph, i) => (
            paragraph.trim() ? <p key={i} className="mb-4">{paragraph}</p> : null
          ))}
        </div>
      </div>
      
      <div className="audio-player card mt-6">
        <h2 className="card-title">Listen to the Story</h2>
        
        {audioUrl ? (
          <AudioPlayer 
            src={audioUrl} 
            downloadFileName={`${story.metadata?.title || 'bedtime-story'}.mp3`} 
          />
        ) : (
          <p className="text-center py-4">Audio not available for this story</p>
        )}
      </div>
      
      <div className="story-actions mt-6">
        <Button variant="secondary" onClick={() => window.location.href = "/child/dashboard"}>
          Back to Dashboard
        </Button>
      </div>
    </section>
  );
};