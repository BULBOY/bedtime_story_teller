"use client";

import Button from "@components/Button";

export default function Settings() {
  return (
    <section className="settings-container">
      <h1 className="settings-title">Settings</h1>
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

      <p>Manage your preferences:</p>
      <label>
        <input type="checkbox" /> Enable Notifications
      </label>

      <Button>Save Settings</Button>
    </section>
  );
}
