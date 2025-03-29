"use client"; 

import TextInput from "../../components/TextInput";
import Button from "../../components/Button";

export default function Profile() {
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

      <form>
        <TextInput label="Edit Your Email" type="email" placeholder="Enter your new email" />
        <TextInput label="Edit Your Password" type="password" placeholder="Enter a new password" />
        <Button type="submit">Update Profile</Button>
      </form>
    </section>
  );
}
