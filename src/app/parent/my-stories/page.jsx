'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import LoadingSpinner from '@components/LoadingSpinner';

export default function MyStories() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingStoryId, setDeletingStoryId] = useState(null);
  
  useEffect(() => {
    // Fetch user stories when session is available
    if (status === "authenticated" && session?.user?.id) {
      fetchUserStories(session.user.id);
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, session, router]);
  
  const fetchUserStories = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stories?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }
      
      const data = await response.json();
      setStories(data.stories || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(err.message || 'An error occurred while fetching your stories');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeletingStoryId(storyId);
      const response = await fetch(`/api/story/${storyId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete story');
      }
      
      // Remove the deleted story from the state
      setStories(stories.filter(story => story.id !== storyId));
    } catch (err) {
      console.error('Error deleting story:', err);
      setError('Failed to delete story. Please try again.');
    } finally {
      setDeletingStoryId(null);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get a preview of the story text
  const getStoryPreview = (storyText, maxLength = 150) => {
    if (!storyText) return '';
    
    if (storyText.length <= maxLength) return storyText;
    
    return storyText.substring(0, maxLength) + '...';
  };
  
  if (status === "loading" || loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <p className="mt-4 text-lg text-white">Loading your stories...</p>
      </div>
    );
  }
  
  return (
    <div className="create-story-container max-w-5xl mx-auto">
      <h1 className="create-story-title">My Stories</h1>
      
      {error && (
        <div className="card border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700 font-semibold text-center">{error}</p>
        </div>
      )}
      
      <div className="story-actions mt-6 flex justify-center gap-4 mb-8">
        <Link href="/create-story" className="button primary">
          Create New Story
        </Link>
      </div>
      
      {stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map((story) => (
            <div key={story.id} className="card">
              <h3 className="card-title">
                {story.metadata?.theme?.charAt(0).toUpperCase() + story.metadata?.theme?.slice(1) || 'Untitled'} Story
              </h3>
              <p className="text-indigo-800 mb-4">
                {getStoryPreview(story.story)}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-indigo-600">
                <div>
                  <p><strong>Age:</strong> {story.metadata?.age} years</p>
                  <p><strong>Length:</strong> {story.metadata?.length}</p>
                </div>
                <div>
                  <p><strong>Created:</strong> {formatDate(story.metadata?.createdAt)}</p>
                  {story.metadata?.lastEdited && (
                    <p><strong>Last Edited:</strong> {formatDate(story.metadata.lastEdited)}</p>
                  )}
                </div>
              </div>
              
              {story.metadata?.tags && story.metadata.tags.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-indigo-600">Tags:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {story.metadata.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="tag-item text-xs py-1 px-2">
                        {tag}
                      </span>
                    ))}
                    {story.metadata.tags.length > 5 && (
                      <span className="text-xs text-indigo-500">+{story.metadata.tags.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-center mt-4 gap-3">
                <Link href={`/story/${story.id}`} className="button secondary text-sm px-4 py-2">
                  Read Story
                </Link>
                <Link href={`/edit-story/${story.id}`} className="button primary text-sm px-4 py-2">
                  Edit Story
                </Link>
                <button 
                  onClick={() => handleDeleteStory(story.id)}
                  disabled={deletingStoryId === story.id}
                  className={`${deletingStoryId === story.id ? 'button disabled' : 'button'} text-sm px-4 py-2`}
                  style={{ backgroundColor: '#e53e3e', color: 'white', borderColor: '#e53e3e' }}
                >
                  {deletingStoryId === story.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8">
          <p className="text-xl text-indigo-800 mb-4">You haven't created any stories yet.</p>
          <p className="text-indigo-600 mb-6">Create your first magical bedtime story!</p>
          <Link href="/create-story" className="button primary">
            Create Your First Story
          </Link>
        </div>
      )}
    </div>
  );
}