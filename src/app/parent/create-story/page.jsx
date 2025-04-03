'use client';

// app/create-story/page.jsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StoryForm from '@components/StoryForm';
import LoadingSpinner from '@components/LoadingSpinner';
import Button from "@components/Button";
import { useSession, signOut } from "next-auth/react";

export default function CreateStory() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedStory, setGeneratedStory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStory, setEditedStory] = useState('');
  const { data: session, status } = useSession();
  
  const handleSubmit = async (storyData) => {
    setLoading(true);
    setError(null);
    
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
      
      // Set the generated story data instead of redirecting
      setGeneratedStory(data);
    } catch (err) {
      console.error('Error generating story:', err);
      setError(err.message || 'An error occurred while generating the story');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/save-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: generatedStory.id, // Assuming this is the story ID
          story: generatedStory.story, // Extract the story part
          metadata: generatedStory.metadata, // Extract the metadata part
          userId: session.user.id // Include userId in the request body
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save story');
      }
      
      // Navigate to the story view page after saving
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

  const handleSaveEdit = () => {
    // Update the generatedStory with the edited content
    setGeneratedStory({
      ...generatedStory,
      story: editedStory
    });
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
              <h2 className="card-title">Preview Your Story</h2>
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