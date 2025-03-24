// app/child-dashboard/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "@components/Button";
import Card from "@components/Card";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from 'src/lib/firebase/firebase_conf';

export default function ChildDashboard() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

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
            title: storyData.metadata?.theme || "Bedtime Story",
            description: storyData.story.substring(0, 80) + "...",
            story: storyData.story,
            metadata: storyData.metadata
          });
        });
        
        setStories(storyList);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [session, status, router]);

  const handlePlayStory = (storyId) => {
    router.push(`/child/story-player?id=${storyId}`);
  };

  if (status === "loading") {
    return <div className="loading-indicator">Loading...</div>;
  }

  return (
    <section className="dashboard-container">
      
      <p className="dashboard-description">
        Welcome {session?.user.name || "there"}! Select a bedtime story to listen to.
      </p>

      {loading ? (
        <div className="loading-indicator">Loading your stories...</div>
      ) : stories.length === 0 ? (
        <div className="no-stories">
          <p>No stories available yet. Ask your parent to create some stories for you!</p>
        </div>
      ) : (
        <div className="stories-list">
          {stories.map((story) => (
            <Card 
              key={story.id} 
              title={story.title} 
              description={story.description}
            >
              <div className="story-metadata">
                {story.metadata?.age && <span className="age-badge">Age: {story.metadata.age}</span>}
                {story.metadata?.createdAt && (
                  <span className="date-badge">
                    {new Date(story.metadata.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <Button 
                variant="primary" 
                onClick={() => handlePlayStory(story.id)}
              >
                Play
              </Button>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}