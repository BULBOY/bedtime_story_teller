'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StoryForm from '@components/StoryForm';
import LoadingSpinner from '@components/LoadingSpinner';
import Button from "@components/Button";
import { useSession } from "next-auth/react";
import AudioPlayer from '@components/AudioPlayer';
import VoiceSelector from "@components/VoiceSelector";
import { convertStory } from "@components/ttsClient";


export default function EditStory() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [story, setStory] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewStory, setPreviewStory] = useState(null);
  const { data: session, status } = useSession();
  
  // Audio related states
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [voiceName, setVoiceName] = useState("en-US-Wavenet-D");
  const [speakingRate, setSpeakingRate] = useState(1);
  
  // Fetch the story when component mounts
  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/story/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Story not found');
          }
          throw new Error('Failed to fetch story');
        }
        
        const data = await response.json();
        setStory(data);
        
        // Set audio URL if it exists in the story metadata
        if (data.metadata?.audioUrl) {
          setAudioUrl(data.metadata.audioUrl);
        }
        
        // Set voice settings if they exist in the story metadata
        if (data.metadata?.voiceName) {
          setVoiceName(data.metadata.voiceName);
        }
        
        if (data.metadata?.speakingRate) {
          setSpeakingRate(data.metadata.speakingRate);
        }
      } catch (err) {
        console.error('Error fetching story:', err);
        setError(err.message || 'An error occurred while fetching the story');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchStory();
    }
  }, [id]);
  
  const handleEditSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    // Generate tags for the updated story content
    // let generatedTags = [];
    // try {
    //   generatedTags = await generateTags(
    //     formData.editInstructions, 
    //     formData.age, 
    //     formData.theme
    //   );
    // } catch (tagError) {
    //   console.error('Error generating tags for updated story:', tagError);
    //   // Continue with existing tags if generation fails
    //   generatedTags = [];
    // }
    
    try {
      // The tag generation will be handled server-side in the API
      // We just need to pass all the form data to the API
      
      const response = await fetch(`/api/story/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Include all form data fields
          title: formData.title,
          prompt: formData.prompt,
          age: formData.age,
          theme: formData.theme,
          length: formData.length,
          editInstructions: formData.editInstructions,
          customTags: formData.customTags,
          categories: formData.categories,
          // generatedTags: generatedTags
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update story');
      }
      
      // Get the updated story and show preview
      const updatedStory = await response.json();
      setPreviewStory(updatedStory);
      
      // Generate new audio for the updated story
      await handleGenerateAudio(updatedStory.story);
      
      setIsPreviewMode(true);
      
    } catch (err) {
      console.error('Error updating story:', err);
      setError(err.message || 'An error occurred while updating the story');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateAudio = async (storyText) => {
    if (!storyText || !storyText.trim()) {
      setError("No story text to convert to audio");
      return;
    }
    
    setAudioLoading(true);
    setError(null);
    
    try {
      // Generate audio using the same story ID to replace the existing audio file
      const audioUrl = await convertStory(
        storyText,
        voiceName,
        0, // Default pitch value
        Number(speakingRate),
        id // Use the same story ID to replace existing audio
      );
      
      setAudioUrl(audioUrl);
    } catch (error) {
      console.error('Error converting to audio:', error);
      setError(`Failed to generate audio: ${error.message}`);
    } finally {
      setAudioLoading(false);
    }
  };
  
  const confirmSave = async () => {
    try {
      setLoading(true);
      
      // Update the story metadata with the audio information
      const response = await fetch(`/api/story/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updateMetadataOnly: true, // Flag to indicate we're only updating metadata
          audioUrl: audioUrl,
          voiceName: voiceName,
          speakingRate: Number(speakingRate)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save audio settings');
      }
      
      // Navigate back to the stories list
      router.push('/parent/my-stories');
    } catch (err) {
      console.error('Error saving audio settings:', err);
      setError(err.message || 'An error occurred while saving audio settings');
    } finally {
      setLoading(false);
    }
  };
  
  const cancelPreview = () => {
    setIsPreviewMode(false);
    setPreviewStory(null);
  };
  
  const handleVoiceChange = (newVoice) => {
    setVoiceName(newVoice);
  };
  
  const handleSpeakingRateChange = (e) => {
    setSpeakingRate(e.target.value);
  };
  
  const regenerateAudio = async () => {
    // Re-generate audio with the current story and voice settings
    const storyText = isPreviewMode ? previewStory.story : story.story;
    await handleGenerateAudio(storyText);
  };
  
  if (loading && !isPreviewMode) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <p className="mt-4 text-lg text-white">Loading story...</p>
      </div>
    );
  }
  
  if (error && !isPreviewMode) {
    return (
      <div className="create-story-container max-w-5xl mx-auto">
        <h1 className="create-story-title">Edit Story</h1>
        <div className="card border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700 font-semibold text-center">{error}</p>
        </div>
        <div className="story-actions mt-6 flex justify-center gap-4">
          <Button onClick={() => router.push('/parent/my-stories')} variant="secondary">
            Back to My Stories
          </Button>
        </div>
      </div>
    );
  }
  
  if (!story && !isPreviewMode) {
    return (
      <div className="create-story-container max-w-5xl mx-auto">
        <h1 className="create-story-title">Edit Story</h1>
        <div className="card text-center py-8">
          <p className="text-xl text-indigo-800 mb-4">Story not found</p>
          <p className="text-indigo-600 mb-6">The story you're trying to edit doesn't exist or has been deleted.</p>
          <Button onClick={() => router.push('/parent/my-stories')} variant="primary">
            Go to My Stories
          </Button>
        </div>
      </div>
    );
  }
  
  if (isPreviewMode && previewStory) {
    return (
      <div className="create-story-container max-w-5xl mx-auto">
        <h1 className="create-story-title">Preview Updated Story</h1>
        
        <div className="story-card mb-6">
          <h2 className="card-title">{previewStory.metadata?.title || "Untitled Story"}</h2>
          <div className="prose max-w-none">
            {previewStory.story.split('\n').map((paragraph, i) => (
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
              onVoiceChange={handleVoiceChange} 
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
                onChange={handleSpeakingRateChange}
                placeholder="1 = normal speed (0.25 to 4)"
                className="form-input"
              />
            </div>
            
            <Button 
              type="button" 
              onClick={regenerateAudio} 
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
              <AudioPlayer src={audioUrl} downloadFileName={`${previewStory.metadata?.title || 'bedtime-story'}.mp3`} />
            </div>
          ) : (
            <p className="text-center py-4">No audio preview available</p>
          )}
        </div>
        
        <div className="card mt-6">
          <h3 className="card-title mb-4">Story Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-ffd700 bg-opacity-10">
              <p className="mb-2"><strong>Age Range:</strong> {previewStory.metadata?.age} years</p>
              <p className="mb-2"><strong>Theme:</strong> {previewStory.metadata?.theme}</p>
              <p className="mb-2"><strong>Length:</strong> {previewStory.metadata?.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-ffd700 bg-opacity-10">
              <p className="mb-2"><strong>Tags:</strong></p>
              <div className="flex flex-wrap gap-2 mt-2">
                {previewStory.metadata?.tags?.map(tag => (
                  <span key={tag} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-md text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="story-actions mt-6 flex justify-center gap-4">
          <Button onClick={cancelPreview} variant="secondary">
            Continue Editing
          </Button>
          <Button onClick={confirmSave} variant="primary">
            Save Changes & Return to My Stories
          </Button>
        </div>
      </div>
    );
  }
  
  // Prepare initial data for the form
  const initialData = {
    id: story.id,
    title: story.metadata.title || '',
    prompt: story.metadata.prompt || '',
    age: story.metadata.age || 7,
    theme: story.metadata.theme || 'adventure',
    length: story.metadata.length || 'medium',
    customTags: story.metadata.tags || [],
    categories: story.metadata.categories || [],
    editInstructions: '',
  };
  
  return (
    <div className="create-story-container max-w-5xl mx-auto">
      <h1 className="create-story-title">Edit Story</h1>
      
      {/* Display the current story */}
      <div className="story-card mb-6">
        <h2 className="card-title">Current Story</h2>
        <div className="prose max-w-none">
          {story.story.split('\n').map((paragraph, i) => (
            paragraph.trim() ? <p key={i} className="mb-4 text-sm text-indigo-800">{paragraph}</p> : null
          ))}
        </div>
      </div>
      
      {/* Current audio preview if available */}
      {audioUrl && (
        <div className="card mt-6 mb-6">
          <h3 className="card-title mb-4">Current Audio</h3>
          <AudioPlayer src={audioUrl} downloadFileName={`${story.metadata?.title || 'bedtime-story'}.mp3`} />
        </div>
      )}
      
      {/* Edit form */}
      <StoryForm 
        onSubmit={handleEditSubmit}
        initialData={initialData}
      />
    </div>
  );
}