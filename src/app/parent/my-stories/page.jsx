'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import LoadingSpinner from '@components/LoadingSpinner';
import Button from "@components/Button";

export default function MyStories() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingStoryId, setDeletingStoryId] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    theme: "all",
    age: "all",
    length: "all"
  });
  
  // Available filter options
  const [filterOptions, setFilterOptions] = useState({
    themes: [],
    ages: [],
    lengths: ["short", "medium", "long"]
  });
  
  useEffect(() => {
    // Fetch user stories when session is available
    if (status === "authenticated" && session?.user?.id) {
      fetchUserStories(session.user.id);
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, session, router]);
  
  // Apply filters whenever stories or filters change
  useEffect(() => {
    applyFilters();
  }, [stories, filters]);
  
  // Extract filter options from stories
  useEffect(() => {
    if (stories.length > 0) {
      // Extract unique themes
      const themes = [...new Set(stories
        .map(story => story.metadata?.theme)
        .filter(theme => theme))];
      
      // Extract unique ages
      const ages = [...new Set(stories
        .map(story => story.metadata?.age)
        .filter(age => age))].sort((a, b) => a - b);
      
      setFilterOptions(prev => ({
        ...prev,
        themes,
        ages
      }));
    }
  }, [stories]);
  
  const fetchUserStories = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stories?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }
      
      const data = await response.json();
      setStories(data.stories || []);
      setFilteredStories(data.stories || []);
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

      if (response.status === 404) {
        console.error(`Story not found: ${storyId}`);
        setError(`Story not found. It may have been already deleted.`);
        return;
      }
      
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
  
  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  // Apply all filters to stories
  const applyFilters = () => {
    let result = [...stories];
    
    // Filter by theme
    if (filters.theme !== "all") {
      result = result.filter(story => 
        story.metadata?.theme === filters.theme
      );
    }
    
    // Filter by age
    if (filters.age !== "all") {
      const selectedAge = parseInt(filters.age);
      result = result.filter(story => {
        // Handle both cases where age might be stored as number or string
        const storyAge = typeof story.metadata?.age === 'string' 
          ? parseInt(story.metadata.age) 
          : story.metadata?.age;
        
        return storyAge === selectedAge;
      });
    }
    
    // Filter by length
    if (filters.length !== "all") {
      result = result.filter(story => 
        story.metadata?.length === filters.length
      );
    }
    
    setFilteredStories(result);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      theme: "all",
      age: "all",
      length: "all"
    });
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
        
        {/* Filter Options */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-ffd700">Filter Stories</h3>
          
          {/* Theme Filter */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-white">Theme</label>
            <select 
              value={filters.theme}
              onChange={(e) => handleFilterChange('theme', e.target.value)}
              className="form-select w-full bg-white text-4b0082 border-2 border-white rounded-lg"
            >
              <option value="all">All Themes</option>
              {filterOptions.themes.map(theme => (
                <option key={theme} value={theme}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Age Filter */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-white">Age</label>
            <select 
              value={filters.age}
              onChange={(e) => handleFilterChange('age', e.target.value)}
              className="form-select w-full bg-white text-4b0082 border-2 border-white rounded-lg"
            >
              <option value="all">All Ages</option>
              {filterOptions.ages.map(age => (
                <option key={age} value={age}>
                  {age} years
                </option>
              ))}
            </select>
          </div>
          
          {/* Length Filter */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-white">Length</label>
            <select 
              value={filters.length}
              onChange={(e) => handleFilterChange('length', e.target.value)}
              className="form-select w-full bg-white text-4b0082 border-2 border-white rounded-lg"
            >
              <option value="all">All Lengths</option>
              <option value="short">Short (3-5 min)</option>
              <option value="medium">Medium (5-8 min)</option>
              <option value="long">Long (8-12 min)</option>
            </select>
          </div>
          
          {/* Filter Stats */}
          <div className="mt-4 text-sm text-white">
            <p>Showing {filteredStories.length} of {stories.length} stories</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="card border-l-4 border-red-500 p-4 mb-6 ml-64">
          <p className="text-red-700 font-semibold text-center">{error}</p>
        </div>
      )}
      
      <div className="recent-stories-container">
        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStories.map((story) => (
              <div key={story.id} className="card">
                <h3 className="card-title">
                  {story.metadata?.title || "Untitled Story"}
                </h3>
                <p className="text-indigo-800 mb-4">
                  {getStoryPreview(story.story)}
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-indigo-600">
                  <div>
                    <p><strong>Age:</strong> {story.metadata?.age} years</p>
                    <p><strong>Theme:</strong> {story.metadata?.theme}</p>
                    <p><strong>Length:</strong> {story.metadata?.length}</p>
                  </div>
                  <div>
                    <p><strong>Created:</strong> {formatDate(story.metadata?.createdAt)}</p>
                    {story.metadata?.lastEdited && (
                      <p><strong>Last Edited:</strong> {formatDate(story.metadata.lastEdited)}</p>
                    )}
                    {story.metadata?.audioUrl && (
                      <p className="text-green-600"><strong>Audio:</strong> Available</p>
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
                    className="button secondary text-sm px-4 py-2"
                    style={{ 
                      backgroundColor: deletingStoryId === story.id ? '#e2e8f0' : '#e53e3e', 
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {deletingStoryId === story.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : stories.length > 0 ? (
          <div className="card text-center py-8">
            <p className="text-xl text-indigo-800 mb-4">No stories match your filters</p>
            <p className="text-indigo-600 mb-6">Try adjusting your filter criteria or create a new story.</p>
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-xl text-indigo-800 mb-4">You haven't created any stories yet.</p>
            <p className="text-indigo-600 mb-6">Create your first magical bedtime story!</p>
            <Link href="/parent/create-story" className="button primary">
              Create Your First Story
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}