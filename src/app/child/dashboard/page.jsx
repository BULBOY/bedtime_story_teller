// app/child/dashboard/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "@components/Button";
import Card from "@components/Card";
import LoadingSpinner from "@components/LoadingSpinner";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from 'src/lib/firebase/firebase_conf';

export default function ChildDashboard() {
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  
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
    // Redirect if not logged in or not a child
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "loading") {
      return;
    }

    if (session?.user.role === "parent") {
      router.push("/parent");
      return;
    }

    // Fetch stories from Firestore
    fetchStories();
  }, [session, status, router]);
  
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

  const fetchStories = async () => {
    try {
      setLoading(true);
      
      // Create a query to get stories
      // If the child has a parentId, fetch stories from that parent
      let storiesQuery;
      
      if (session?.user.parentId) {
        // Get stories created by the parent
        storiesQuery = query(
          collection(db, "stories"), 
          where("metadata.userId", "==", session.user.parentId)
        );
      } else {
        // If no parentId, get all stories (you may want to limit this in production)
        storiesQuery = collection(db, "stories");
      }
      
      const querySnapshot = await getDocs(storiesQuery);
      
      const storyList = [];
      querySnapshot.forEach((doc) => {
        const storyData = doc.data();
        storyList.push({
          id: doc.id,
          title: storyData.metadata?.title || "Bedtime Story",
          description: storyData.story.substring(0, 80) + "...",
          story: storyData.story,
          metadata: storyData.metadata
        });
      });
      
      setStories(storyList);
      setFilteredStories(storyList);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
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
    if (!stories.length) return;
    
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

  const handlePlayStory = (storyId) => {
    router.push(`/child/story-player?id=${storyId}`);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      <h1 className="create-story-title">My Bedtime Stories</h1>
      
      {/* Sidebar / Navbar on the left */}
      <div className="dashboard-actions-container">
        <h1 className="dashboard-title">Story Explorer</h1>
        <p className="dashboard-description">
          Welcome {session?.user.name || "there"}! Find your perfect bedtime story.
        </p>
        
        {/* Filter Options */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-ffd700">Find Stories</h3>
          
          {/* Theme Filter */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-white">Story Theme</label>
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
            <label className="block mb-2 text-sm font-medium text-white">Age Range</label>
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
            <label className="block mb-2 text-sm font-medium text-white">Story Length</label>
            <select 
              value={filters.length}
              onChange={(e) => handleFilterChange('length', e.target.value)}
              className="form-select w-full bg-white text-4b0082 border-2 border-white rounded-lg"
            >
              <option value="all">Any Length</option>
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
      
      {/* Main content area with stories */}
      <div className="recent-stories-container">
        {filteredStories.length > 0 ? (
          <div className="stories-list">
            {filteredStories.map((story) => (
              <Card 
                key={story.id} 
                title={story.title}
                description={story.description}
              >
                <div className="story-metadata">
                  <p><strong>Age:</strong> {story.metadata?.age} years</p>
                  <p><strong>Theme:</strong> {story.metadata?.theme}</p>
                  <p><strong>Length:</strong> {story.metadata?.length}</p>
                  <p><strong>Created:</strong> {formatDate(story.metadata?.createdAt)}</p>
                  {story.metadata?.audioUrl && (
                    <p className="text-green-600"><strong>Audio:</strong> Available</p>
                  )}
                </div>
                <Button 
                  variant="primary" 
                  onClick={() => handlePlayStory(story.id)}
                >
                  Play Story
                </Button>
              </Card>
            ))}
          </div>
        ) : stories.length > 0 ? (
          <div className="card text-center py-8">
            <p className="text-xl text-indigo-800 mb-4">No stories match your filters</p>
            <p className="text-indigo-600 mb-6">Try selecting different options to find a story.</p>
            <Button variant="secondary" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-xl text-indigo-800 mb-4">No stories available yet</p>
            <p className="text-indigo-600 mb-6">Ask your parent to create some stories for you!</p>
          </div>
        )}
      </div>
    </div>
  );
}