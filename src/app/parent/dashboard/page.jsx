"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "@components/Button";
import Card from "@components/Card";
import LoadingSpinner from "@components/LoadingSpinner";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from 'src/lib/firebase/firebase_conf';

export default function ParentDashboard() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

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

  const handlePlayStory = (storyId) => {
    router.push(`/parent/story-player?id=${storyId}`);
  };

  const handleEditStory = (storyId) => {
    router.push(`/edit-story/${storyId}`);
  };

  const handleCreateStory = () => {
    router.push("/parent/create-story");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (status === "loading") {
    return (
      <div className="text-center py-12">
        <LoadingSpinner />
        <p className="mt-4 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <section className="parent-dashboard-container">
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

      {/* Main Content - Stories List */}
      <div className="recent-stories-container">
        <div className="flex justify-between items-center mb-6">
          <h2 className="dashboard-subtitle">Your Stories</h2>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <LoadingSpinner />
            <p className="mt-4 text-lg">Loading your stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-xl text-indigo-800 mb-4">You haven't created any stories yet.</p>
            <p className="text-indigo-600 mb-6">Create your first magical bedtime story!</p>
            <Button variant="primary" onClick={handleCreateStory}>
              Create Your First Story
            </Button>
          </div>
        ) : (
          <div className="stories-list">
            {stories.map((story) => (
              <Card 
                key={story.id} 
                title={story.metadata?.title} 
                description={story.description}
              >
                <div className="story-metadata mb-3">
                  <div className="flex gap-2 flex-wrap mb-2">
                    {/* {story.metadata?.title && (
                      <span className="theme-badge bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
                        {story.metadata.title}
                      </span>
                    )} */}
                    {story.metadata?.age && (
                      <span className="age-badge bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        Age: {story.metadata.age}
                      </span>
                    )}
                    {story.hasAudio && (
                      <span className="audio-badge bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        Audio
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {formatDate(story.metadata?.createdAt)}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="secondary" 
                    onClick={() => handlePlayStory(story.id)}
                    className="text-sm px-4 py-2"
                  >
                    Play
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => handleEditStory(story.id)}
                    className="text-sm px-4 py-2"
                  >
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}