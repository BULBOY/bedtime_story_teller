'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StoryForm from '@components/StoryForm';
import LoadingSpinner from '@components/LoadingSpinner';
import Button from "@components/Button";
import { useSession } from "next-auth/react";

export default function EditStory() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [story, setStory] = useState(null);
  const { data: session, status } = useSession();
  
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
    
    try {
      const response = await fetch(`/api/story/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          editInstructions: formData.editInstructions,
          customTags: formData.customTags,
          categories: formData.categories
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update story');
      }
      
      // Navigate back to the story view
      router.push(`/story/${id}`);
    } catch (err) {
      console.error('Error updating story:', err);
      setError(err.message || 'An error occurred while updating the story');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <p className="mt-4 text-lg text-white">Loading story...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="create-story-container max-w-5xl mx-auto">
        <h1 className="create-story-title">Edit Story</h1>
        <div className="card border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700 font-semibold text-center">{error}</p>
        </div>
        <div className="story-actions mt-6 flex justify-center gap-4">
          <Button onClick={() => router.push('/my-stories')} variant="secondary">
            Back to My Stories
          </Button>
        </div>
      </div>
    );
  }
  
  if (!story) {
    return (
      <div className="create-story-container max-w-5xl mx-auto">
        <h1 className="create-story-title">Edit Story</h1>
        <div className="card text-center py-8">
          <p className="text-xl text-indigo-800 mb-4">Story not found</p>
          <p className="text-indigo-600 mb-6">The story you're trying to edit doesn't exist or has been deleted.</p>
          <Button onClick={() => router.push('/my-stories')} variant="primary">
            Go to My Stories
          </Button>
        </div>
      </div>
    );
  }
  
  // Prepare initial data for the form
  const initialData = {
    id: story.id,
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
      
      {/* Edit form */}
      <StoryForm 
        onSubmit={handleEditSubmit}
        initialData={initialData}
      />
    </div>
  );
}