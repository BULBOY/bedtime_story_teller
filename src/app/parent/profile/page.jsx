"use client"; 

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from 'src/lib/firebase/firebase_conf';
import TextInput from "../../components/TextInput";
import Button from "../../components/Button";
import VoiceSelector from "../../components/VoiceSelector";
import AudioPlayer from "@components/AudioPlayer";
import { convertStory } from "../../components/ttsClient";

export default function Profile() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [voiceName, setVoiceName] = useState("en-US-Wavenet-D");
  const [speakingRate, setSpeakingRate] = useState(1);
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  useEffect(() => {
    // Load user data when session is available
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
        // Set selected voice if it exists in user data
        if (userData.preferredVoice) {
          setVoiceName(userData.preferredVoice);
        }
        
        // Set speaking rate if it exists
        if (userData.speakingRate) {
          setSpeakingRate(userData.speakingRate);
        }
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
      setError("Failed to load preferences. Please try again.");
    }
  };
  
  const handlePreviewVoice = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Sample text for preview
      const sampleText = "This is a preview of your selected voice. It will be used for all your bedtime stories.";
      
      // Using your existing convertStory function
      const url = await convertStory(
        sampleText,
        voiceName,
        0, // Default pitch
        Number(speakingRate)
      );
      
      setAudioUrl(url);
      
    } catch (error) {
      console.error('Error previewing voice:', error);
      setError('Failed to preview voice. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      // Update user preferences in Firestore
      if (session?.user?.id) {
        const userDocRef = doc(db, "users", session.user.id);
        await updateDoc(userDocRef, {
          preferredVoice: voiceName,
          speakingRate: Number(speakingRate),
          lastUpdated: new Date().toISOString()
        });
        
        setSuccess("Profile updated successfully!");
      } else {
        throw new Error("You must be logged in to update your profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="profile-container">
      <h1 className="profile-title">Your Profile</h1>
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

      {/* Display success or error messages */}
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2 className="card-title">Voice Preferences</h2>
          <p className="card-description">
            Select your preferred voice for story narration
          </p>
          
          <div className="form-group">
            <label className="form-label">Voice Selection</label>
            <VoiceSelector 
              selectedVoice={voiceName} 
              onVoiceChange={setVoiceName} 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="speakingRate" className="form-label">Speaking Rate</label>
            <input
              id="speakingRate"
              type="number"
              step="0.1"
              min="0.25"
              max="4" 
              value={speakingRate}
              onChange={(e) => setSpeakingRate(e.target.value)}
              placeholder="1 = normal speed (0.25 to 4)"
              className="form-input"
            />
            <p className="text-sm mt-1">
              1.0 is normal speed, lower values are slower, higher values are faster
            </p>
          </div>
          
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handlePreviewVoice}
            disabled={loading}
          >
            {loading ? "Generating Preview..." : "Preview Voice"}
          </Button>
          
          {audioUrl && (
            <div className="mt-4">
              <p>Voice Preview:</p>
              <AudioPlayer src={audioUrl} downloadFileName="voice-preview.mp3" />
            </div>
          )}
        </div>
        
        <div className="card mt-6">
          <h2 className="card-title">Account Settings</h2>
          
          <TextInput 
            label="Edit Your Email" 
            type="email" 
            placeholder="Enter your new email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <TextInput 
            label="Edit Your Password" 
            type="password" 
            placeholder="Enter a new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <Button 
            type="submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </form>
    </section>
  );
}