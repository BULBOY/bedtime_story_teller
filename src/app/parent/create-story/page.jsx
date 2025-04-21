'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { doc, getDoc } from 'firebase/firestore';
import { db } from 'src/lib/firebase/firebase_conf';
import StoryForm from '@components/StoryForm';
import LoadingSpinner from '@components/LoadingSpinner';
import Button from "@components/Button";
import AudioPlayer from '@components/AudioPlayer';
import VoiceSelector from "@components/VoiceSelector";
import { convertStory } from "@components/ttsClient";

export default function CreateStory() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedStory, setGeneratedStory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStory, setEditedStory] = useState('');
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [voiceName, setVoiceName] = useState("en-US-Wavenet-D");
  const [speakingRate, setSpeakingRate] = useState(1);
  const [tracks, setTracks] = useState([]);
  
  // Load user's preferred voice when component mounts
  useEffect(() => {
    if (session?.user?.id) {
      loadUserPreferences(session.user.id);
    }
  }, [session]);
  
  const loadUserPreferences = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Set preferred voice if it exists in user data
        if (userData.preferredVoice) {
          setVoiceName(userData.preferredVoice);
        }
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
      // Continue with default voice
    }
  };
  
  const handleSubmit = async (storyData) => {
    setLoading(true);
    setError(null);
    setAudioUrl('');
    
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate story');
      }
      
      // Set the generated story data
      setGeneratedStory(data);
      
      // Generate audio preview
      await handleConvertToAudio(data.story, data.id);
    } catch (err) {
      console.error('Error generating story:', err);
      setError(err.message || 'An error occurred while generating the story');
    } finally {
      setLoading(false);
    }
  };
  
  const handleConvertToAudio = async (storyText, storyId) => {
    if (!storyText || !storyText.trim()) {
      setError("No story text to convert to audio");
      return;
    }
    
    setAudioLoading(true);
    setError(null);
    
    try {
      // Using your existing convertStory function
      const audioUrl = await convertStory(
        storyText,
        voiceName,
        0, // Default pitch value
        Number(speakingRate),
        storyId || undefined
      );
      
      setAudioUrl(audioUrl);
      
      // Add to track history
      const newTrack = { 
        id: Date.now(), 
        src: audioUrl, 
        title: `Story Audio (${new Date().toLocaleTimeString()})` 
      };
      
      setTracks(prev => [...prev, newTrack]);
    } catch (error) {
      console.error('Error converting to audio:', error);
      setError(`Failed to generate audio: ${error.message}`);
    } finally {
      setAudioLoading(false);
    }
  };
  
  const handleRemoveTrack = (trackId) => {
    // Filter out the track with the given ID
    const updatedTracks = tracks.filter(track => track.id !== trackId);
    
    // Update state
    setTracks(updatedTracks);
    
    // If current audio is removed, clear it
    const removedTrack = tracks.find(track => track.id === trackId);
    if (removedTrack && removedTrack.src === audioUrl) {
      setAudioUrl("");
    }
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Save the story first
      const storyResponse = await fetch('/api/save-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: generatedStory.id,
          story: generatedStory.story,
          metadata: {
            ...generatedStory.metadata,
            audioUrl: audioUrl,
            voiceName: voiceName,
            speakingRate: speakingRate
          },
          userId: session.user.id
        }),
      });
      
      if (!storyResponse.ok) {
        const errorData = await storyResponse.json();
        throw new Error(errorData.message || 'Failed to save story');
      }
      
      // Navigate to the dashboard after saving
      router.push(`/parent/dashboard`);
    } catch (err) {
      console.error('Error saving story:', err);
      setError(err.message || 'Failed to save story');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStoryEdit = () => {
    // Initialize the edited story with the current story content
    setEditedStory(generatedStory.story);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    // Update the generatedStory with the edited content
    setGeneratedStory({
      ...generatedStory,
      story: editedStory
    });
    
    // Generate new audio for the edited story
    await handleConvertToAudio(editedStory, generatedStory.id);
    
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Discard changes
    setEditedStory('');
  };

  return (
    <div className="create-story-container max-w-5xl mx-auto">
      <h1 className="create-story-title">Create a New Story</h1>
      {/* Sidebar / Navbar on the left */}
      <div className="dashboard-actions-container">
        <h1 className="dashboard-title">Parent Dashboard</h1>
        <p className="dashboard-description">Manage your bedtime stories</p>

        <div className="dashboard-actions">
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/parent/create-story")}
          >
            Create New Story
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/parent/my-stories")}
          >
            My Stories
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/parent/profile")}
          >
            Profile
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/parent/settings")}
          >
            Settings
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="card border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700 font-semibold text-center">{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="card text-center py-12">
          <LoadingSpinner />
          <p className="mt-4 text-lg text-indigo-800">
            {generatedStory ? "Saving your story..." : "Generating your story... This may take a moment as our AI crafts a unique tale."}
          </p>
        </div>
      ) : generatedStory && !isEditing ? (
        <div>
          <div className="story-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">{generatedStory.metadata?.title || "Untitled Story"}</h2>
              <button 
                onClick={handleStoryEdit}
                className="button secondary text-sm px-4 py-2"
              >
                Edit Story
              </button>
            </div>
            <div className="prose max-w-none">
              {generatedStory.story.split('\n').map((paragraph, i) => (
                paragraph.trim() ? <p key={i} className="mb-4 text-lg">{paragraph}</p> : null
              ))}
            </div>
          </div>
          
          {/* Voice Settings Section */}
          <div className="card mt-6">
            <h3 className="card-title mb-4">Voice Settings</h3>
            <div className="voice-selection-container">
              <label>Select Voice:</label>
              <VoiceSelector 
                selectedVoice={voiceName} 
                onVoiceChange={setVoiceName} 
              />
            </div>
            
            <div className="settings-grid mt-4">
              <div className="form-group">
                <label htmlFor="speakingRate" className="form-label">Speaking Rate</label>
                <input
                  id="speakingRate"
                  name="speakingRate"
                  type="number"
                  step="0.1"
                  min="0.25"
                  max="4"
                  value={speakingRate}
                  onChange={(e) => setSpeakingRate(e.target.value)}
                  placeholder="1 = normal speed (0.25 to 4)"
                  className="form-input"
                />
              </div>
              
              <Button 
                type="button" 
                onClick={() => handleConvertToAudio(generatedStory.story, generatedStory.id)} 
                disabled={audioLoading}
                className="mt-4"
              >
                {audioLoading ? "Generating..." : "Regenerate Audio"}
              </Button>
            </div>
          </div>
          
          {/* Audio Preview Section */}
          <div className="card mt-6">
            <h3 className="card-title mb-4">Story Audio Preview</h3>
            {audioLoading ? (
              <div className="text-center py-4">
                <LoadingSpinner />
                <p className="mt-2">Generating audio preview...</p>
              </div>
            ) : audioUrl ? (
              <div>
                <AudioPlayer src={audioUrl} downloadFileName="bedtime-story.mp3" />
              </div>
            ) : (
              <p className="text-center py-4">No audio preview available</p>
            )}
          </div>
          
          {/* Audio History */}
          {tracks.length > 0 && (
            <div className="card mt-6">
              <h3 className="card-title mb-4">Audio History</h3>
              <ul className="audio-history-list">
                {tracks.map((track) => (
                  <li key={track.id} className="audio-history-item mb-4 p-4 border rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">{track.title}</span>
                      <button
                        onClick={() => handleRemoveTrack(track.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                    <AudioPlayer src={track.src} downloadFileName={`${track.title}.mp3`} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="card mt-6">
            <h3 className="card-title mb-4">Story Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-ffd700 bg-opacity-10">
                <p className="mb-2"><strong>Age Range:</strong> {generatedStory.metadata?.age} years</p>
                <p className="mb-2"><strong>Theme:</strong> {generatedStory.metadata?.theme}</p>
                <p className="mb-2"><strong>Length:</strong> {generatedStory.metadata?.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-ffd700 bg-opacity-10">
                <p className="mb-2"><strong>Tags:</strong></p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {generatedStory.metadata?.tags?.map(tag => (
                    <span key={tag} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="story-actions mt-6 flex justify-center gap-4">
            <button onClick={() => setGeneratedStory(null)} className="button secondary">
              Create Another Story
            </button>
            <button onClick={handleSave} className="button primary">
              Save Story
            </button>
          </div>
        </div>
      ) : isEditing ? (
        <div>
          <div className="story-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Edit Your Story</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleCancelEdit}
                  className="button secondary text-sm px-4 py-2"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="button primary text-sm px-4 py-2"
                >
                  Save Changes
                </button>
              </div>
            </div>
            <textarea
              value={editedStory}
              onChange={(e) => setEditedStory(e.target.value)}
              className="input-field h-96 w-full font-sans text-lg"
              placeholder="Edit your story here..."
            />
          </div>
        </div>
      ) : (
        <StoryForm onSubmit={handleSubmit} />
      )}
    </div>
  );
}